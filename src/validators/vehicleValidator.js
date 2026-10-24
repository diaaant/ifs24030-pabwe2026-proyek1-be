const { z } = require('zod');
const { VEHICLE_TYPES } = require('../config/constants');
const { pagination, optionalText } = require('./common');

const currentYear = new Date().getFullYear();

const plateNumber = z
  .string({ message: 'Nomor polisi wajib diisi' })
  .trim()
  .toUpperCase()
  .transform((value) => value.replace(/\s+/g, ' '))
  .pipe(z.string().regex(/^[A-Z]{1,2} ?\d{1,4} ?[A-Z]{0,3}$/, 'Nomor polisi tidak valid (contoh: BK 1234 AB)'));

const body = z.object({
  plate_number: plateNumber,
  brand: z.string({ message: 'Merek wajib diisi' }).trim().min(2, 'Merek minimal 2 karakter').max(40),
  model: z.string({ message: 'Model wajib diisi' }).trim().min(1, 'Model wajib diisi').max(60),
  year: z.coerce
    .number({ message: 'Tahun harus berupa angka' })
    .int()
    .min(1980, 'Tahun minimal 1980')
    .max(currentYear + 1, `Tahun maksimal ${currentYear + 1}`),
  vehicle_type: z.enum(VEHICLE_TYPES, { message: 'Jenis kendaraan harus motor atau mobil' }),
  color: optionalText(30),
  odometer: z.coerce.number({ message: 'Kilometer harus berupa angka' }).int().min(0, 'Kilometer tidak boleh negatif').default(0),
});

const list = z.object({
  ...pagination,
  search: z.string().trim().optional(),
  vehicle_type: z.enum(VEHICLE_TYPES).optional(),
});

module.exports = { body, list };
