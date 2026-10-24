const { z } = require('zod');

const idParam = z.object({
  id: z.coerce.number({ message: 'ID harus berupa angka' }).int().positive('ID tidak valid'),
});

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

const isoDate = (label = 'Tanggal') =>
  z
    .string({ message: `${label} wajib diisi` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} harus berformat YYYY-MM-DD`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} tidak valid`);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .nullable()
    .transform((value) => value || null);

const rupiah = (label) =>
  z.coerce.number({ message: `${label} harus berupa angka` }).int().min(0, `${label} tidak boleh negatif`);

module.exports = { idParam, pagination, isoDate, optionalText, rupiah };
