const { z } = require('zod');
const { BOOKING_STATUS, TIME_SLOTS } = require('../config/constants');
const { pagination, isoDate, optionalText, rupiah } = require('./common');

const STATUS_VALUES = Object.values(BOOKING_STATUS);

const create = z.object({
  vehicle_id: z.coerce.number({ message: 'Kendaraan wajib dipilih' }).int().positive('Kendaraan wajib dipilih'),
  service_id: z.coerce.number({ message: 'Layanan wajib dipilih' }).int().positive('Layanan wajib dipilih'),
  booking_date: isoDate('Tanggal booking'),
  time_slot: z.enum(TIME_SLOTS, { message: 'Jam booking tidak tersedia' }),
  odometer: z.coerce.number().int().min(0, 'Kilometer tidak boleh negatif').optional().nullable(),
  complaint: optionalText(500),
});

const list = z.object({
  ...pagination,
  status: z.enum(STATUS_VALUES).optional(),
  date: isoDate('Tanggal').optional(),
  search: z.string().trim().optional(),
});

const availability = z.object({ date: isoDate('Tanggal') });

const updateStatus = z.object({
  status: z.enum(
    [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
    { message: 'Status harus confirmed, in_progress, atau cancelled' },
  ),
  admin_note: optionalText(300),
});

const complete = z.object({
  odometer: z.coerce.number({ message: 'Kilometer saat servis wajib diisi' }).int().min(0, 'Kilometer tidak boleh negatif'),
  work_done: z.string({ message: 'Pekerjaan yang dilakukan wajib diisi' }).trim().min(5, 'Deskripsi pekerjaan minimal 5 karakter').max(1000),
  parts_cost: rupiah('Biaya suku cadang').optional(),
  labor_cost: rupiah('Biaya jasa').optional(),
  next_service_date: isoDate('Tanggal servis berikutnya').optional().nullable(),
  next_service_km: z.coerce.number().int().min(0).optional().nullable(),
  notes: optionalText(500),
});

module.exports = { create, list, availability, updateStatus, complete };
