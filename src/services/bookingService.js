const env = require('../config/env');
const { getDb } = require('../db/connection');
const { BOOKING_STATUS, TIME_SLOTS, CLOSED_WEEKDAY } = require('../config/constants');
const AppError = require('../utils/AppError');
const { assertOwnerOrAdmin, isAdmin } = require('../utils/access');
const { buildMeta } = require('../utils/response');
const { toPaging } = require('../utils/pagination');
const { todayISO, weekday, addDays } = require('../utils/dates');
const bookingRepository = require('../repositories/bookingRepository');
const vehicleRepository = require('../repositories/vehicleRepository');
const serviceRepository = require('../repositories/serviceRepository');
const historyRepository = require('../repositories/historyRepository');
const { withInvoice } = require('./historyService');

const NOT_FOUND = 'Booking tidak ditemukan';

/** Alur status yang diizinkan untuk perubahan oleh admin. */
const TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.CANCELLED],
};

const CUSTOMER_CANCELLABLE = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];
const COMPLETABLE = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS];

const findAccessible = (user, id) => {
  const booking = bookingRepository.findById(id);
  if (!booking) throw new AppError(404, NOT_FOUND);
  assertOwnerOrAdmin(user, booking.user_id, NOT_FOUND);
  return booking;
};

const assertBookableDate = (date) => {
  if (date < todayISO()) {
    throw new AppError(422, 'Tanggal booking tidak boleh di masa lalu', [
      { field: 'booking_date', message: 'Pilih tanggal hari ini atau setelahnya' },
    ]);
  }
  if (weekday(date) === CLOSED_WEEKDAY) {
    throw new AppError(422, 'Bengkel libur pada hari Minggu', [
      { field: 'booking_date', message: 'Pilih hari Senin sampai Sabtu' },
    ]);
  }
};

const getAvailability = (date) => {
  const closed = weekday(date) === CLOSED_WEEKDAY;
  const usage = new Map(bookingRepository.countActiveBySlot(date).map((row) => [row.time_slot, row.total]));
  const slots = TIME_SLOTS.map((time) => {
    const booked = usage.get(time) ?? 0;
    return { time, capacity: env.slotCapacity, booked, available: closed ? 0 : Math.max(0, env.slotCapacity - booked) };
  });
  return { date, closed, slots };
};

const list = (user, { status, date, search, ...paging }) => {
  const { page, limit, offset } = toPaging(paging);
  const filter = { userId: isAdmin(user) ? null : user.id, status, date, search };
  return {
    items: bookingRepository.list({ ...filter, limit, offset }),
    meta: buildMeta(page, limit, bookingRepository.count(filter)),
  };
};

const get = (user, id) => findAccessible(user, id);

const resolveBookableTargets = (user, input) => {
  const vehicle = vehicleRepository.findById(input.vehicle_id);
  if (!vehicle) throw new AppError(404, 'Kendaraan tidak ditemukan');
  assertOwnerOrAdmin(user, vehicle.user_id, 'Kendaraan tidak ditemukan');

  const service = serviceRepository.findById(input.service_id);
  if (!service || !service.is_active) throw new AppError(404, 'Layanan tidak ditemukan');
  if (service.vehicle_type !== 'semua' && service.vehicle_type !== vehicle.vehicle_type) {
    throw new AppError(422, `Layanan ini hanya untuk ${service.vehicle_type}`, [
      { field: 'service_id', message: `Layanan ini hanya untuk ${service.vehicle_type}` },
    ]);
  }
  return { vehicle, service };
};

const create = (user, input) => {
  const { vehicle, service } = resolveBookableTargets(user, input);
  assertBookableDate(input.booking_date);

  return getDb().transaction(() => {
    if (bookingRepository.countActiveInSlot(input.booking_date, input.time_slot) >= env.slotCapacity) {
      throw new AppError(409, 'Jam yang dipilih sudah penuh, pilih jam lain', [
        { field: 'time_slot', message: 'Slot sudah penuh' },
      ]);
    }
    if (bookingRepository.hasActiveForVehicleOnDate(vehicle.id, input.booking_date)) {
      throw new AppError(409, 'Kendaraan ini sudah punya booking aktif pada tanggal tersebut');
    }
    return bookingRepository.create({ ...input, userId: vehicle.user_id, estimatedPrice: service.price });
  })();
};

const cancel = (user, id) => {
  const booking = findAccessible(user, id);
  const cancellable = isAdmin(user) ? Object.keys(TRANSITIONS) : CUSTOMER_CANCELLABLE;
  if (!cancellable.includes(booking.status)) {
    throw new AppError(409, 'Booking pada status ini tidak dapat dibatalkan');
  }
  return bookingRepository.updateStatus(id, BOOKING_STATUS.CANCELLED);
};

const updateStatus = (id, { status, admin_note: adminNote }) => {
  const booking = bookingRepository.findById(id);
  if (!booking) throw new AppError(404, NOT_FOUND);

  const allowed = TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(409, `Status ${booking.status} tidak dapat diubah menjadi ${status}`);
  }
  return bookingRepository.updateStatus(id, status, adminNote);
};

const buildFollowUp = (service, input, serviceDate) => ({
  next_service_date:
    input.next_service_date ?? (service.interval_days ? addDays(serviceDate, service.interval_days) : null),
  next_service_km: input.next_service_km ?? (service.interval_km ? input.odometer + service.interval_km : null),
});

/** Selesaikan booking: catat riwayat servis, naikkan odometer kendaraan, dan jadwalkan servis berikutnya. */
const complete = (id, input) => {
  const booking = bookingRepository.findById(id);
  if (!booking) throw new AppError(404, NOT_FOUND);
  if (!COMPLETABLE.includes(booking.status)) {
    throw new AppError(409, 'Hanya booking berstatus confirmed atau in_progress yang dapat diselesaikan');
  }
  if (input.odometer < booking.vehicle_odometer) {
    throw new AppError(422, 'Kilometer tidak boleh lebih kecil dari kilometer kendaraan saat ini', [
      { field: 'odometer', message: `Minimal ${booking.vehicle_odometer} km` },
    ]);
  }

  const service = serviceRepository.findById(booking.service_id);
  const serviceDate = todayISO();
  const partsCost = input.parts_cost ?? 0;
  const laborCost = input.labor_cost ?? booking.estimated_price;

  return getDb().transaction(() => {
    const history = historyRepository.create({
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      user_id: booking.user_id,
      service_id: booking.service_id,
      service_date: serviceDate,
      odometer: input.odometer,
      work_done: input.work_done,
      parts_cost: partsCost,
      labor_cost: laborCost,
      total_cost: partsCost + laborCost,
      notes: input.notes,
      ...buildFollowUp(service, input, serviceDate),
    });
    vehicleRepository.raiseOdometer(booking.vehicle_id, input.odometer);
    bookingRepository.updateStatus(id, BOOKING_STATUS.COMPLETED);
    return { booking: bookingRepository.findById(id), history: withInvoice(history) };
  })();
};

module.exports = { getAvailability, list, get, create, cancel, updateStatus, complete };
