const ROLES = Object.freeze({ CUSTOMER: 'customer', ADMIN: 'admin' });

const VEHICLE_TYPES = Object.freeze(['motor', 'mobil']);
const SERVICE_VEHICLE_TYPES = Object.freeze(['motor', 'mobil', 'semua']);

const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

/** Status booking yang masih memakai kuota slot. */
const ACTIVE_STATUSES = Object.freeze([
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.IN_PROGRESS,
]);

/** Jam operasional bengkel (istirahat 12:00). Minggu libur. */
const TIME_SLOTS = Object.freeze([
  '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00',
]);

const CLOSED_WEEKDAY = 0; // Minggu

/** Ambang pengingat servis. */
const REMINDER = Object.freeze({ SOON_DAYS: 14, SOON_KM: 300 });

module.exports = {
  ROLES,
  VEHICLE_TYPES,
  SERVICE_VEHICLE_TYPES,
  BOOKING_STATUS,
  ACTIVE_STATUSES,
  TIME_SLOTS,
  CLOSED_WEEKDAY,
  REMINDER,
};
