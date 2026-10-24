const request = require('supertest');
const {
  app, bootstrap, authed, loginAdmin, registerCustomer, createVehicle, openDate, nextSunday, findService,
} = require('./helpers');
const { todayISO, addDays } = require('../src/utils/dates');

let admin;
let customer;
let motorService;
let carService;
let vehicles;

const book = (token, vehicle, overrides = {}) =>
  request(app)
    .post('/api/bookings')
    .set(authed(token))
    .send({ vehicle_id: vehicle.id, service_id: motorService.id, booking_date: openDate(2), time_slot: '09:00', ...overrides });

beforeAll(async () => {
  bootstrap();
  admin = await loginAdmin();
  customer = await registerCustomer('booking');
  motorService = await findService(admin, 'Ganti Oli Mesin Motor');
  carService = await findService(admin, 'Servis Berkala Mobil');
  vehicles = [];
  for (let i = 0; i < 4; i += 1) vehicles.push(await createVehicle(customer.token, `BB 70${i} AA`));
});

describe('Ketersediaan dan pembuatan booking', () => {
  test('ketersediaan slot menandai hari Minggu sebagai libur', async () => {
    const closed = await request(app).get(`/api/bookings/availability?date=${nextSunday()}`).set(authed(customer.token));
    expect(closed.body.data.closed).toBe(true);
    expect(closed.body.data.slots.every((slot) => slot.available === 0)).toBe(true);

    const open = await request(app).get(`/api/bookings/availability?date=${openDate(3)}`).set(authed(customer.token));
    expect(open.body.data.closed).toBe(false);
    expect(open.body.data.slots[0]).toMatchObject({ time: '08:00', capacity: 2, available: 2 });
  });

  test('booking valid berstatus pending dan menyimpan estimasi harga', async () => {
    const res = await book(customer.token, vehicles[0]);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'pending', estimated_price: motorService.price });
    expect(res.body.data.code).toMatch(/^BK-\d{8}-[0-9A-F]{6}$/);
  });

  test('menolak tanggal lampau, hari Minggu, dan layanan beda jenis kendaraan', async () => {
    const past = await book(customer.token, vehicles[1], { booking_date: addDays(todayISO(), -1) });
    expect(past.status).toBe(422);

    const sunday = await book(customer.token, vehicles[1], { booking_date: nextSunday() });
    expect(sunday.status).toBe(422);

    const mismatch = await book(customer.token, vehicles[1], { service_id: carService.id });
    expect(mismatch.status).toBe(422);
  });

  test('menolak booking ganda satu kendaraan pada tanggal yang sama', async () => {
    const res = await book(customer.token, vehicles[0], { time_slot: '10:00' });
    expect(res.status).toBe(409);
  });

  test('kuota slot dibatasi dua kendaraan per jam', async () => {
    const date = openDate(5);
    expect((await book(customer.token, vehicles[0], { booking_date: date, time_slot: '14:00' })).status).toBe(201);
    expect((await book(customer.token, vehicles[1], { booking_date: date, time_slot: '14:00' })).status).toBe(201);

    const full = await book(customer.token, vehicles[2], { booking_date: date, time_slot: '14:00' });
    expect(full.status).toBe(409);
    expect(full.body.errors[0].field).toBe('time_slot');

    const availability = await request(app).get(`/api/bookings/availability?date=${date}`).set(authed(customer.token));
    expect(availability.body.data.slots.find((slot) => slot.time === '14:00').available).toBe(0);
  });

  test('kendaraan orang lain tidak bisa dibooking', async () => {
    const stranger = await registerCustomer('asing');
    const res = await book(stranger.token, vehicles[3]);
    expect(res.status).toBe(404);
  });
});

describe('Alur status dan penyelesaian servis', () => {
  let booking;

  beforeAll(async () => {
    const res = await book(customer.token, vehicles[3], { booking_date: openDate(8), time_slot: '08:00' });
    booking = res.body.data;
  });

  test('pelanggan tidak boleh mengubah status, dan alur harus berurutan', async () => {
    const asCustomer = await request(app).patch(`/api/bookings/${booking.id}/status`).set(authed(customer.token)).send({ status: 'confirmed' });
    expect(asCustomer.status).toBe(403);

    const skip = await request(app).patch(`/api/bookings/${booking.id}/status`).set(authed(admin)).send({ status: 'in_progress' });
    expect(skip.status).toBe(409);

    const notComplete = await request(app).post(`/api/bookings/${booking.id}/complete`).set(authed(admin)).send({ odometer: 11000, work_done: 'Ganti oli mesin' });
    expect(notComplete.status).toBe(409);
  });

  test('admin mengonfirmasi, mengerjakan, lalu menyelesaikan servis', async () => {
    const confirmed = await request(app).patch(`/api/bookings/${booking.id}/status`).set(authed(admin)).send({ status: 'confirmed', admin_note: 'Silakan datang tepat waktu' });
    expect(confirmed.body.data).toMatchObject({ status: 'confirmed', admin_note: 'Silakan datang tepat waktu' });

    await request(app).patch(`/api/bookings/${booking.id}/status`).set(authed(admin)).send({ status: 'in_progress' });

    const lowerOdometer = await request(app).post(`/api/bookings/${booking.id}/complete`).set(authed(admin)).send({ odometer: 100, work_done: 'Ganti oli mesin' });
    expect(lowerOdometer.status).toBe(422);

    const done = await request(app)
      .post(`/api/bookings/${booking.id}/complete`)
      .set(authed(admin))
      .send({ odometer: 10500, work_done: 'Ganti oli mesin 0,8 liter', parts_cost: 45000 });

    expect(done.status).toBe(200);
    expect(done.body.data.booking.status).toBe('completed');
    const { history } = done.body.data;
    expect(history).toMatchObject({ odometer: 10500, parts_cost: 45000, labor_cost: motorService.price, total_cost: 45000 + motorService.price, next_service_km: 12500 });
    expect(history.next_service_date).toBe(addDays(todayISO(), motorService.interval_days));
    expect(history.invoice_number).toMatch(/^INV-\d{8}-0001$/);

    const again = await request(app).post(`/api/bookings/${booking.id}/complete`).set(authed(admin)).send({ odometer: 10600, work_done: 'Ganti oli mesin' });
    expect(again.status).toBe(409);
  });

  test('odometer kendaraan naik dan riwayat serta invoice dapat dibaca pemilik', async () => {
    const vehicle = await request(app).get(`/api/vehicles/${vehicles[3].id}`).set(authed(customer.token));
    expect(vehicle.body.data.odometer).toBe(10500);

    const history = await request(app).get('/api/history').set(authed(customer.token));
    expect(history.body.meta.total).toBe(1);
    const record = history.body.data[0];
    expect(record.invoice_number).toMatch(/^INV-\d{8}-0001$/);

    const invoice = await request(app).get(`/api/history/${record.id}`).set(authed(customer.token));
    expect(invoice.body.data).toMatchObject({ plate_number: 'BB 703 AA', service_name: 'Ganti Oli Mesin Motor' });

    const byVehicle = await request(app).get(`/api/vehicles/${vehicles[3].id}/history`).set(authed(customer.token));
    expect(byVehicle.body.data).toHaveLength(1);

    const stranger = await registerCustomer('intip');
    expect((await request(app).get(`/api/history/${record.id}`).set(authed(stranger.token))).status).toBe(404);
  });

  test('pengingat servis dihitung dari riwayat terakhir', async () => {
    const res = await request(app).get('/api/reminders').set(authed(customer.token));
    const byPlate = Object.fromEntries(res.body.data.map((item) => [item.plate_number, item]));

    expect(byPlate['BB 703 AA']).toMatchObject({ status: 'ok', km_left: 2000, days_left: 60 });
    expect(byPlate['BB 700 AA'].status).toBe('no_history');

    const filtered = await request(app).get('/api/reminders?status=no_history').set(authed(customer.token));
    expect(filtered.body.data.every((item) => item.status === 'no_history')).toBe(true);
  });
});

describe('Pembatalan booking', () => {
  test('pelanggan dapat membatalkan booking pending, tetapi tidak yang sudah selesai', async () => {
    const vehicle = await createVehicle(customer.token, 'BB 710 CC');
    const created = await book(customer.token, vehicle, { booking_date: openDate(12), time_slot: '15:00' });

    const cancelled = await request(app).patch(`/api/bookings/${created.body.data.id}/cancel`).set(authed(customer.token));
    expect(cancelled.body.data.status).toBe('cancelled');

    const again = await request(app).patch(`/api/bookings/${created.body.data.id}/cancel`).set(authed(customer.token));
    expect(again.status).toBe(409);
  });

  test('pelanggan dan admin melihat daftar booking sesuai hak aksesnya', async () => {
    const mine = await request(app).get('/api/bookings?status=pending').set(authed(customer.token));
    expect(mine.status).toBe(200);
    expect(mine.body.data.every((item) => item.status === 'pending')).toBe(true);

    const all = await request(app).get('/api/bookings?limit=100').set(authed(admin));
    expect(all.body.meta.total).toBeGreaterThanOrEqual(mine.body.meta.total);

    const detail = await request(app).get(`/api/bookings/${mine.body.data[0].id}`).set(authed(customer.token));
    expect(detail.body.data.code).toBe(mine.body.data[0].code);
  });
});

describe('Layanan dan statistik', () => {
  test('hanya admin yang boleh mengelola layanan; layanan terpakai dinonaktifkan', async () => {
    const payload = { name: 'Cuci Karburator', description: 'Pembersihan karburator', vehicle_type: 'motor', price: 75000, duration_minutes: 45, interval_days: '', interval_km: 3000 };

    expect((await request(app).post('/api/services').set(authed(customer.token)).send(payload)).status).toBe(403);

    const created = await request(app).post('/api/services').set(authed(admin)).send(payload);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ interval_days: null, interval_km: 3000, is_active: true });

    const duplicate = await request(app).post('/api/services').set(authed(admin)).send(payload);
    expect(duplicate.status).toBe(409);

    const removed = await request(app).delete(`/api/services/${created.body.data.id}`).set(authed(admin));
    expect(removed.body.data.deactivated).toBe(false);

    const used = await request(app).delete(`/api/services/${motorService.id}`).set(authed(admin));
    expect(used.body.data.deactivated).toBe(true);
    const hidden = await request(app).get('/api/services').set(authed(customer.token));
    expect(hidden.body.data.some((service) => service.id === motorService.id)).toBe(false);
  });

  test('dashboard admin dan pelanggan memiliki isi berbeda', async () => {
    const adminStats = await request(app).get('/api/stats/dashboard').set(authed(admin));
    expect(adminStats.body.data.role).toBe('admin');
    expect(adminStats.body.data.bookings_per_month).toHaveLength(6);
    expect(adminStats.body.data.totals.revenue).toBeGreaterThan(0);

    const customerStats = await request(app).get('/api/stats/dashboard').set(authed(customer.token));
    expect(customerStats.body.data.role).toBe('customer');
    expect(customerStats.body.data.totals.vehicles).toBe(5);
    expect(customerStats.body.data.status_counts.completed).toBe(1);
  });
});
