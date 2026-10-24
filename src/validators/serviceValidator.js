const { z } = require('zod');
const { SERVICE_VEHICLE_TYPES } = require('../config/constants');
const { optionalText, rupiah } = require('./common');

const optionalPositiveInt = (label) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number({ message: `${label} harus berupa angka` }).int().positive(`${label} harus lebih dari 0`).nullable(),
  );

const body = z.object({
  name: z.string({ message: 'Nama layanan wajib diisi' }).trim().min(3, 'Nama layanan minimal 3 karakter').max(80),
  description: optionalText(300),
  vehicle_type: z.enum(SERVICE_VEHICLE_TYPES, { message: 'Jenis kendaraan tidak valid' }).default('semua'),
  price: rupiah('Harga'),
  duration_minutes: z.coerce.number({ message: 'Durasi harus berupa angka' }).int().min(10, 'Durasi minimal 10 menit').max(600),
  interval_days: optionalPositiveInt('Interval hari'),
  interval_km: optionalPositiveInt('Interval kilometer'),
  is_active: z.boolean({ message: 'is_active harus true atau false' }).default(true),
});

const list = z.object({
  vehicle_type: z.enum(SERVICE_VEHICLE_TYPES).optional(),
  include_inactive: z.enum(['true', 'false']).default('false'),
});

module.exports = { body, list };
