const { z } = require('zod');

const password = z
  .string({ message: 'Kata sandi wajib diisi' })
  .min(8, 'Kata sandi minimal 8 karakter')
  .max(72, 'Kata sandi maksimal 72 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/\d/, 'Kata sandi harus mengandung angka');

const phone = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)8\d{7,12}$/, 'Nomor telepon tidak valid (contoh: 081234567890)')
  .optional()
  .nullable()
  .transform((value) => value || null);

const register = z.object({
  name: z.string({ message: 'Nama wajib diisi' }).trim().min(3, 'Nama minimal 3 karakter').max(80),
  email: z.string({ message: 'Email wajib diisi' }).trim().toLowerCase().pipe(z.email('Format email tidak valid')),
  phone,
  password,
});

const login = z.object({
  email: z.string({ message: 'Email wajib diisi' }).trim().toLowerCase().pipe(z.email('Format email tidak valid')),
  password: z.string({ message: 'Kata sandi wajib diisi' }).min(1, 'Kata sandi wajib diisi'),
});

const updateProfile = z.object({
  name: z.string({ message: 'Nama wajib diisi' }).trim().min(3, 'Nama minimal 3 karakter').max(80),
  phone,
});

const changePassword = z.object({
  current_password: z.string({ message: 'Kata sandi lama wajib diisi' }).min(1, 'Kata sandi lama wajib diisi'),
  new_password: password,
});

module.exports = { register, login, updateProfile, changePassword };
