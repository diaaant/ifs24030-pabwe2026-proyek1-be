const request = require('supertest');
const { createApp } = require('../src/app');
const { seedIfEmpty } = require('../src/db/seed');
const { todayISO, addDays, weekday } = require('../src/utils/dates');

const app = createApp();

const bootstrap = () => seedIfEmpty();

const authed = (token) => ({ Authorization: `Bearer ${token}` });

const loginAdmin = async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@bengkelku.id', password: 'Admin123!' });
  return res.body.data.token;
};

const registerCustomer = async (suffix) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `Pelanggan ${suffix}`, email: `pelanggan${suffix}@example.com`, password: 'Rahasia123' });
  return { token: res.body.data.token, user: res.body.data.user };
};

const vehiclePayload = (plate, overrides = {}) => ({
  plate_number: plate,
  brand: 'Honda',
  model: 'Beat',
  year: 2021,
  vehicle_type: 'motor',
  color: 'Putih',
  odometer: 10000,
  ...overrides,
});

const createVehicle = async (token, plate, overrides) => {
  const res = await request(app).post('/api/vehicles').set(authed(token)).send(vehiclePayload(plate, overrides));
  return res.body.data;
};

/** Tanggal terdekat (mulai hari ini + minOffset) yang bukan hari Minggu. */
const openDate = (minOffset = 1) => {
  let date = addDays(todayISO(), minOffset);
  while (weekday(date) === 0) date = addDays(date, 1);
  return date;
};

const nextSunday = () => {
  let date = addDays(todayISO(), 1);
  while (weekday(date) !== 0) date = addDays(date, 1);
  return date;
};

const findService = async (token, name) => {
  const res = await request(app).get('/api/services').set(authed(token));
  return res.body.data.find((service) => service.name === name);
};

module.exports = {
  app,
  bootstrap,
  authed,
  loginAdmin,
  registerCustomer,
  createVehicle,
  vehiclePayload,
  openDate,
  nextSunday,
  findService,
};
