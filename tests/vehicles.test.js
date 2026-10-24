const request = require('supertest');
const { app, bootstrap, authed, loginAdmin, registerCustomer, createVehicle, vehiclePayload } = require('./helpers');

let owner;
let other;

beforeAll(async () => {
  bootstrap();
  owner = await registerCustomer('pemilik');
  other = await registerCustomer('lain');
});

describe('Kendaraan', () => {
  test('menambah kendaraan dan menormalkan nomor polisi', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authed(owner.token))
      .send(vehiclePayload('bk  1234   ab'));

    expect(res.status).toBe(201);
    expect(res.body.data.plate_number).toBe('BK 1234 AB');
  });

  test('menolak nomor polisi ganda dan format salah', async () => {
    const duplicate = await request(app).post('/api/vehicles').set(authed(other.token)).send(vehiclePayload('BK 1234 AB'));
    expect(duplicate.status).toBe(409);

    const invalid = await request(app).post('/api/vehicles').set(authed(other.token)).send(vehiclePayload('123 ABC 999'));
    expect(invalid.status).toBe(422);
  });

  test('pelanggan hanya melihat kendaraan miliknya, admin melihat semua', async () => {
    await createVehicle(other.token, 'BB 9001 ZZ');

    const mine = await request(app).get('/api/vehicles').set(authed(owner.token));
    expect(mine.body.data.every((vehicle) => vehicle.plate_number !== 'BB 9001 ZZ')).toBe(true);

    const adminToken = await loginAdmin();
    const all = await request(app).get('/api/vehicles?search=BB 9001').set(authed(adminToken));
    expect(all.body.data).toHaveLength(1);
  });

  test('kendaraan milik orang lain tidak dapat diakses', async () => {
    const vehicle = await createVehicle(other.token, 'BB 9002 ZZ');

    expect((await request(app).get(`/api/vehicles/${vehicle.id}`).set(authed(owner.token))).status).toBe(404);
    expect((await request(app).delete(`/api/vehicles/${vehicle.id}`).set(authed(owner.token))).status).toBe(404);
  });

  test('mengubah dan menghapus kendaraan sendiri', async () => {
    const vehicle = await createVehicle(owner.token, 'BB 9003 ZZ');

    const updated = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set(authed(owner.token))
      .send(vehiclePayload('BB 9003 ZZ', { color: 'Merah', odometer: 12000 }));
    expect(updated.body.data).toMatchObject({ color: 'Merah', odometer: 12000 });

    expect((await request(app).delete(`/api/vehicles/${vehicle.id}`).set(authed(owner.token))).status).toBe(200);
    expect((await request(app).get(`/api/vehicles/${vehicle.id}`).set(authed(owner.token))).status).toBe(404);
  });

  test('ID tidak valid ditolak validator', async () => {
    const res = await request(app).get('/api/vehicles/abc').set(authed(owner.token));
    expect(res.status).toBe(422);
  });
});
