const request = require('supertest');
const { app, bootstrap, authed, loginAdmin, registerCustomer } = require('./helpers');

beforeAll(bootstrap);

describe('Autentikasi', () => {
  test('register menghasilkan token dan tidak membocorkan password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Budi Santoso', email: 'Budi@Example.com', phone: '081234567890', password: 'Rahasia123' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: 'budi@example.com', role: 'customer' });
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  test('register dengan email yang sama ditolak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Budi Lain', email: 'budi@example.com', password: 'Rahasia123' });

    expect(res.status).toBe(409);
    expect(res.body.errors[0].field).toBe('email');
  });

  test('register dengan data tidak valid mengembalikan daftar error', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bukan-email', password: '123' });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((error) => error.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('login berhasil dan gagal', async () => {
    const ok = await request(app).post('/api/auth/login').send({ email: 'budi@example.com', password: 'Rahasia123' });
    expect(ok.status).toBe(200);

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'budi@example.com', password: 'salah12345' });
    expect(wrongPassword.status).toBe(401);

    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'tidakada@example.com', password: 'Rahasia123' });
    expect(unknownEmail.status).toBe(401);
  });

  test('endpoint terproteksi menolak token kosong dan token rusak', async () => {
    expect((await request(app).get('/api/users/me')).status).toBe(401);
    expect((await request(app).get('/api/users/me').set(authed('token-rusak'))).status).toBe(401);
  });

  test('JSON rusak dan endpoint tidak dikenal ditangani rapi', async () => {
    const broken = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
    expect(broken.status).toBe(400);

    const missing = await request(app).get('/api/tidak-ada');
    expect(missing.status).toBe(404);
  });
});

describe('Profil dan pengguna', () => {
  test('pelanggan dapat mengubah profil dan kata sandi', async () => {
    const { token } = await registerCustomer('profil');

    const profile = await request(app).put('/api/users/me').set(authed(token)).send({ name: 'Nama Baru', phone: '081299998888' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.name).toBe('Nama Baru');

    const wrong = await request(app)
      .put('/api/users/me/password')
      .set(authed(token))
      .send({ current_password: 'salah12345', new_password: 'BaruLagi123' });
    expect(wrong.status).toBe(422);

    const changed = await request(app)
      .put('/api/users/me/password')
      .set(authed(token))
      .send({ current_password: 'Rahasia123', new_password: 'BaruLagi123' });
    expect(changed.status).toBe(200);

    const relogin = await request(app).post('/api/auth/login').send({ email: 'pelangganprofil@example.com', password: 'BaruLagi123' });
    expect(relogin.status).toBe(200);
  });

  test('daftar pengguna hanya untuk admin', async () => {
    const { token } = await registerCustomer('biasa');
    expect((await request(app).get('/api/users').set(authed(token))).status).toBe(403);

    const adminToken = await loginAdmin();
    const res = await request(app).get('/api/users?search=pelanggan').set(authed(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });
});
