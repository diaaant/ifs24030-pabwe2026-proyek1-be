const { TIME_SLOTS, BOOKING_STATUS } = require('../config/constants');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const bearer = [{ bearerAuth: [] }];

const envelope = (data) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, message: { type: 'string' }, data },
});

const paged = (item) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: { type: 'array', items: item },
    meta: ref('Meta'),
  },
});

const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const jsonResponse = (description, schema) => ({ description, content: { 'application/json': { schema } } });

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const query = (name, schema = { type: 'string' }) => ({ name, in: 'query', schema });
const pagingParams = [query('page', { type: 'integer', default: 1 }), query('limit', { type: 'integer', default: 10 })];

const errors = {
  401: jsonResponse('Belum login atau token tidak valid', ref('Error')),
  403: jsonResponse('Role tidak memiliki akses', ref('Error')),
  404: jsonResponse('Data tidak ditemukan', ref('Error')),
  422: jsonResponse('Validasi gagal', ref('Error')),
};

const operation = ({ tag, summary, secured = true, parameters, body, ok, status = '200', codes = [] }) => ({
  tags: [tag],
  summary,
  ...(secured && { security: bearer }),
  ...(parameters && { parameters }),
  ...(body && { requestBody: jsonBody(body) }),
  responses: {
    [status]: ok,
    ...Object.fromEntries(codes.map((code) => [code, errors[code]])),
  },
});

const STATUS_VALUES = Object.values(BOOKING_STATUS);

const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
      errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
    },
  },
  Meta: {
    type: 'object',
    properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' },
      phone: { type: 'string', nullable: true }, role: { type: 'string', enum: ['customer', 'admin'] },
    },
  },
  Vehicle: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, plate_number: { type: 'string', example: 'BK 1234 AB' }, brand: { type: 'string' },
      model: { type: 'string' }, year: { type: 'integer' }, vehicle_type: { type: 'string', enum: ['motor', 'mobil'] },
      color: { type: 'string', nullable: true }, odometer: { type: 'integer' }, owner_name: { type: 'string' },
    },
  },
  VehicleInput: {
    type: 'object',
    required: ['plate_number', 'brand', 'model', 'year', 'vehicle_type'],
    properties: {
      plate_number: { type: 'string', example: 'BB 4521 AK' }, brand: { type: 'string', example: 'Honda' },
      model: { type: 'string', example: 'Beat' }, year: { type: 'integer', example: 2021 },
      vehicle_type: { type: 'string', enum: ['motor', 'mobil'] }, color: { type: 'string' }, odometer: { type: 'integer', example: 15000 },
    },
  },
  Service: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true },
      vehicle_type: { type: 'string', enum: ['motor', 'mobil', 'semua'] }, price: { type: 'integer' },
      duration_minutes: { type: 'integer' }, interval_days: { type: 'integer', nullable: true },
      interval_km: { type: 'integer', nullable: true }, is_active: { type: 'boolean' },
    },
  },
  Booking: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, code: { type: 'string' }, booking_date: { type: 'string', format: 'date' },
      time_slot: { type: 'string', enum: TIME_SLOTS }, status: { type: 'string', enum: STATUS_VALUES },
      plate_number: { type: 'string' }, service_name: { type: 'string' }, customer_name: { type: 'string' },
      complaint: { type: 'string', nullable: true }, estimated_price: { type: 'integer' }, admin_note: { type: 'string', nullable: true },
    },
  },
  ServiceHistory: {
    type: 'object',
    properties: {
      id: { type: 'integer' }, invoice_number: { type: 'string' }, service_date: { type: 'string', format: 'date' },
      odometer: { type: 'integer' }, work_done: { type: 'string' }, total_cost: { type: 'integer' },
      next_service_date: { type: 'string', nullable: true }, next_service_km: { type: 'integer', nullable: true },
    },
  },
  Reminder: {
    type: 'object',
    properties: {
      vehicle_id: { type: 'integer' }, plate_number: { type: 'string' },
      status: { type: 'string', enum: ['overdue', 'soon', 'ok', 'no_history'] },
      days_left: { type: 'integer', nullable: true }, km_left: { type: 'integer', nullable: true },
    },
  },
};

const paths = {
  '/auth/register': {
    post: operation({
      tag: 'Auth', summary: 'Daftar akun pelanggan', secured: false, status: '201', codes: [422],
      body: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' } } },
      ok: jsonResponse('Akun dibuat', envelope({ type: 'object', properties: { user: ref('User'), token: { type: 'string' } } })),
    }),
  },
  '/auth/login': {
    post: operation({
      tag: 'Auth', summary: 'Login dan dapatkan JWT', secured: false, codes: [401, 422],
      body: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
      ok: jsonResponse('Login berhasil', envelope({ type: 'object', properties: { user: ref('User'), token: { type: 'string' } } })),
    }),
  },
  '/users/me': {
    get: operation({ tag: 'Users', summary: 'Profil akun saya', codes: [401], ok: jsonResponse('Profil', envelope(ref('User'))) }),
    put: operation({
      tag: 'Users', summary: 'Ubah profil', codes: [401, 422],
      body: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' } } },
      ok: jsonResponse('Profil diperbarui', envelope(ref('User'))),
    }),
  },
  '/users/me/password': {
    put: operation({
      tag: 'Users', summary: 'Ubah kata sandi', codes: [401, 422],
      body: { type: 'object', properties: { current_password: { type: 'string' }, new_password: { type: 'string' } } },
      ok: jsonResponse('Kata sandi diubah', envelope(null)),
    }),
  },
  '/users': {
    get: operation({ tag: 'Users', summary: 'Daftar pengguna (admin)', parameters: [...pagingParams, query('search')], codes: [401, 403], ok: jsonResponse('Daftar pengguna', paged(ref('User'))) }),
  },
  '/vehicles': {
    get: operation({ tag: 'Vehicles', summary: 'Daftar kendaraan (milik sendiri, admin melihat semua)', parameters: [...pagingParams, query('search'), query('vehicle_type')], codes: [401], ok: jsonResponse('Daftar kendaraan', paged(ref('Vehicle'))) }),
    post: operation({ tag: 'Vehicles', summary: 'Tambah kendaraan', status: '201', codes: [401, 422], body: ref('VehicleInput'), ok: jsonResponse('Kendaraan ditambahkan', envelope(ref('Vehicle'))) }),
  },
  '/vehicles/{id}': {
    get: operation({ tag: 'Vehicles', summary: 'Detail kendaraan', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Detail', envelope(ref('Vehicle'))) }),
    put: operation({ tag: 'Vehicles', summary: 'Ubah kendaraan', parameters: [idParam], codes: [401, 404, 422], body: ref('VehicleInput'), ok: jsonResponse('Diperbarui', envelope(ref('Vehicle'))) }),
    delete: operation({ tag: 'Vehicles', summary: 'Hapus kendaraan', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Dihapus', envelope(null)) }),
  },
  '/vehicles/{id}/history': {
    get: operation({ tag: 'Vehicles', summary: 'Riwayat servis satu kendaraan', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Riwayat', envelope({ type: 'array', items: ref('ServiceHistory') })) }),
  },
  '/services': {
    get: operation({ tag: 'Services', summary: 'Katalog layanan', parameters: [query('vehicle_type'), query('include_inactive', { type: 'string', enum: ['true', 'false'] })], codes: [401], ok: jsonResponse('Daftar layanan', envelope({ type: 'array', items: ref('Service') })) }),
    post: operation({ tag: 'Services', summary: 'Tambah layanan (admin)', status: '201', codes: [401, 403, 422], body: ref('Service'), ok: jsonResponse('Layanan ditambahkan', envelope(ref('Service'))) }),
  },
  '/services/{id}': {
    get: operation({ tag: 'Services', summary: 'Detail layanan', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Detail', envelope(ref('Service'))) }),
    put: operation({ tag: 'Services', summary: 'Ubah layanan (admin)', parameters: [idParam], codes: [401, 403, 404, 422], body: ref('Service'), ok: jsonResponse('Diperbarui', envelope(ref('Service'))) }),
    delete: operation({ tag: 'Services', summary: 'Hapus atau nonaktifkan layanan (admin)', parameters: [idParam], codes: [401, 403, 404], ok: jsonResponse('Dihapus', envelope(null)) }),
  },
  '/bookings/availability': {
    get: operation({ tag: 'Bookings', summary: 'Ketersediaan slot per tanggal', parameters: [{ ...query('date'), required: true }], codes: [401, 422], ok: jsonResponse('Slot', envelope({ type: 'object' })) }),
  },
  '/bookings': {
    get: operation({ tag: 'Bookings', summary: 'Daftar booking', parameters: [...pagingParams, query('status', { type: 'string', enum: STATUS_VALUES }), query('date'), query('search')], codes: [401], ok: jsonResponse('Daftar booking', paged(ref('Booking'))) }),
    post: operation({
      tag: 'Bookings', summary: 'Buat booking servis', status: '201', codes: [401, 404, 422],
      body: { type: 'object', required: ['vehicle_id', 'service_id', 'booking_date', 'time_slot'], properties: { vehicle_id: { type: 'integer' }, service_id: { type: 'integer' }, booking_date: { type: 'string', format: 'date' }, time_slot: { type: 'string', enum: TIME_SLOTS }, odometer: { type: 'integer' }, complaint: { type: 'string' } } },
      ok: jsonResponse('Booking dibuat', envelope(ref('Booking'))),
    }),
  },
  '/bookings/{id}': {
    get: operation({ tag: 'Bookings', summary: 'Detail booking', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Detail', envelope(ref('Booking'))) }),
  },
  '/bookings/{id}/cancel': {
    patch: operation({ tag: 'Bookings', summary: 'Batalkan booking', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Dibatalkan', envelope(ref('Booking'))) }),
  },
  '/bookings/{id}/status': {
    patch: operation({
      tag: 'Bookings', summary: 'Ubah status booking (admin)', parameters: [idParam], codes: [401, 403, 404, 422],
      body: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['confirmed', 'in_progress', 'cancelled'] }, admin_note: { type: 'string' } } },
      ok: jsonResponse('Status diubah', envelope(ref('Booking'))),
    }),
  },
  '/bookings/{id}/complete': {
    post: operation({
      tag: 'Bookings', summary: 'Selesaikan servis dan catat riwayat (admin)', parameters: [idParam], codes: [401, 403, 404, 422],
      body: { type: 'object', required: ['odometer', 'work_done'], properties: { odometer: { type: 'integer' }, work_done: { type: 'string' }, parts_cost: { type: 'integer' }, labor_cost: { type: 'integer' }, next_service_date: { type: 'string', format: 'date' }, next_service_km: { type: 'integer' }, notes: { type: 'string' } } },
      ok: jsonResponse('Servis selesai', envelope({ type: 'object', properties: { booking: ref('Booking'), history: ref('ServiceHistory') } })),
    }),
  },
  '/history': {
    get: operation({ tag: 'History', summary: 'Riwayat servis', parameters: [...pagingParams, query('vehicle_id', { type: 'integer' })], codes: [401], ok: jsonResponse('Riwayat', paged(ref('ServiceHistory'))) }),
  },
  '/history/{id}': {
    get: operation({ tag: 'History', summary: 'Detail riwayat dan data invoice', parameters: [idParam], codes: [401, 404], ok: jsonResponse('Detail', envelope(ref('ServiceHistory'))) }),
  },
  '/reminders': {
    get: operation({ tag: 'Reminders', summary: 'Pengingat servis berikutnya per kendaraan', parameters: [query('status', { type: 'string', enum: ['overdue', 'soon', 'ok', 'no_history'] })], codes: [401], ok: jsonResponse('Pengingat', envelope({ type: 'array', items: ref('Reminder') })) }),
  },
  '/stats/dashboard': {
    get: operation({ tag: 'Stats', summary: 'Ringkasan dashboard (isi berbeda untuk admin dan pelanggan)', codes: [401], ok: jsonResponse('Statistik', envelope({ type: 'object' })) }),
  },
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'BengkelKu API',
    version: '1.0.0',
    description: 'API booking servis, riwayat perawatan, dan pengingat kendaraan.',
  },
  servers: [{ url: '/api' }],
  tags: ['Auth', 'Users', 'Vehicles', 'Services', 'Bookings', 'History', 'Reminders', 'Stats'].map((name) => ({ name })),
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas,
  },
  paths,
};
