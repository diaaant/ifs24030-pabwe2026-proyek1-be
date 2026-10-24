# BengkelKu — Backend

REST API untuk platform booking servis, riwayat perawatan, dan pengingat kendaraan.
Proyek 1 Pengembangan Aplikasi Berbasis Web (PABWE 2026).

> Repository ini berpasangan dengan **frontend**: `ifs24030-pabwe2026-p1-frontend`.
> Keduanya dijalankan terpisah dan berkomunikasi lewat HTTP (REST + JWT).

**Teknologi:** Express.js 5, SQLite (better-sqlite3), JWT, bcrypt, Zod, Swagger UI, Jest + Supertest.

## Hubungan dengan frontend

| Pengaturan | Di mana | Fungsi |
|---|---|---|
| `CORS_ORIGINS` | `.env` backend ini | Isi dengan URL frontend (mis. `http://localhost:3000` atau `https://bengkelku.vercel.app`) |
| `VITE_API_BASEURL` | `.env` frontend (saat build) | Isi dengan URL API ini, mis. `http://localhost:8000/api` |

## Struktur

```
src/
├── config/        env dan konstanta
├── db/            koneksi, skema, seed
├── routes/        pemetaan URL ke controller
├── controllers/   lapisan HTTP
├── services/      logika bisnis
├── repositories/  seluruh query SQL
├── validators/    skema Zod
├── middlewares/   auth, role, validasi, error handler
├── utils/         AppError, tanggal, paginasi, response
└── docs/          spesifikasi OpenAPI
tests/             Jest + Supertest
docs/ERD.md        rancangan basis data
```

Alur: `route → controller → service → repository → SQLite`.

## Menjalankan lokal

Prasyarat: Node.js 20+.

```bash
git clone https://github.com/<username>/ifs24030-pabwe2026-p1-backend.git
cd ifs24030-pabwe2026-p1-backend
cp .env.example .env
npm install
npm run dev          # http://localhost:8000  |  docs: http://localhost:8000/api/docs
```

Database dibuat otomatis di `data/` dan diisi data contoh saat pertama jalan. Reset: `npm run seed`.

**Akun demo**

| Role | Email | Kata sandi |
|---|---|---|
| Admin | admin@bengkelku.id | Admin123! |
| Pelanggan | budi@example.com | Customer123 |

## Pengujian

```bash
npm run lint
npm run test:coverage
```

## Docker

```bash
docker compose up -d --build     # API di http://localhost:8000/api
```

Ganti `JWT_SECRET`, `ADMIN_PASSWORD`, dan `CORS_ORIGINS` lewat environment sebelum dipakai di server publik.

## Deployment online

Host di layanan dengan *persistent volume* (Railway, Fly.io, atau VPS) karena SQLite menyimpan data di file.
Set `NODE_ENV=production`, `JWT_SECRET`, `CORS_ORIGINS` (URL frontend), dan `DB_PATH` ke lokasi volume.

## Jenkins

`Jenkinsfile`: checkout, lint dan test, lalu deploy dengan `docker compose`. Buat job *Pipeline from SCM* yang menunjuk ke repository ini.

## Ringkasan endpoint

| Grup | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Pengguna | `GET/PUT /api/users/me`, `PUT /api/users/me/password`, `GET /api/users` (admin) |
| Kendaraan | `GET/POST /api/vehicles`, `GET/PUT/DELETE /api/vehicles/:id`, `GET /api/vehicles/:id/history` |
| Layanan | `GET /api/services`, `POST/PUT/DELETE /api/services/:id` (admin) |
| Booking | `GET /api/bookings/availability`, `GET/POST /api/bookings`, `GET /api/bookings/:id`, `PATCH /api/bookings/:id/cancel`, `PATCH /api/bookings/:id/status` (admin), `POST /api/bookings/:id/complete` (admin) |
| Riwayat | `GET /api/history`, `GET /api/history/:id` |
| Lainnya | `GET /api/reminders`, `GET /api/stats/dashboard`, `GET /api/health` |
