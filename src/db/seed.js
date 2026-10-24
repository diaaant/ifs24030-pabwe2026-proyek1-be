const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { ROLES, BOOKING_STATUS } = require('../config/constants');
const { getDb, closeDb } = require('./connection');
const { todayISO, addDays } = require('../utils/dates');
const userRepository = require('../repositories/userRepository');
const vehicleRepository = require('../repositories/vehicleRepository');
const serviceRepository = require('../repositories/serviceRepository');
const bookingRepository = require('../repositories/bookingRepository');
const historyRepository = require('../repositories/historyRepository');

const DEMO_PASSWORD = 'Customer123';

const SERVICES = [
  { name: 'Ganti Oli Mesin Motor', description: 'Penggantian oli mesin dan pengecekan kebocoran.', vehicle_type: 'motor', price: 65000, duration_minutes: 30, interval_days: 60, interval_km: 2000 },
  { name: 'Servis Ringan Motor', description: 'Pembersihan filter udara, setel rantai, dan cek kelistrikan.', vehicle_type: 'motor', price: 90000, duration_minutes: 60, interval_days: 90, interval_km: 3000 },
  { name: 'Servis Besar Motor', description: 'Turun mesin ringan, ganti busi, dan kuras karburator/injektor.', vehicle_type: 'motor', price: 250000, duration_minutes: 180, interval_days: 180, interval_km: 6000 },
  { name: 'Ganti Oli Mesin Mobil', description: 'Penggantian oli mesin dan filter oli.', vehicle_type: 'mobil', price: 350000, duration_minutes: 45, interval_days: 180, interval_km: 5000 },
  { name: 'Servis Berkala Mobil', description: 'Paket servis berkala 10.000 km: oli, filter, rem, dan cek 40 titik.', vehicle_type: 'mobil', price: 750000, duration_minutes: 180, interval_days: 180, interval_km: 10000 },
  { name: 'Tune Up Mobil', description: 'Penyetelan mesin, ganti busi, dan pembersihan throttle body.', vehicle_type: 'mobil', price: 600000, duration_minutes: 150, interval_days: 180, interval_km: 10000 },
  { name: 'Spooring dan Balancing', description: 'Penyelarasan roda dan penyeimbangan keempat ban.', vehicle_type: 'mobil', price: 300000, duration_minutes: 90, interval_days: 365, interval_km: 10000 },
  { name: 'Servis AC Mobil', description: 'Cuci evaporator, isi freon, dan ganti filter kabin.', vehicle_type: 'mobil', price: 450000, duration_minutes: 120, interval_days: 365, interval_km: null },
  { name: 'Ganti Kampas Rem', description: 'Penggantian kampas rem depan atau belakang.', vehicle_type: 'semua', price: 250000, duration_minutes: 60, interval_days: 365, interval_km: 20000 },
];

const CUSTOMERS = [
  { name: 'Budi Santoso', email: 'budi@example.com', phone: '081234567801' },
  { name: 'Rotua Sihombing', email: 'rotua@example.com', phone: '082234567802' },
  { name: 'Andreas Simanjuntak', email: 'andreas@example.com', phone: '085234567803' },
];

// owner = indeks CUSTOMERS
const VEHICLES = [
  { owner: 0, plate_number: 'BB 4521 AK', brand: 'Honda', model: 'Beat', year: 2021, vehicle_type: 'motor', color: 'Putih', odometer: 15700 },
  { owner: 0, plate_number: 'BK 1234 AB', brand: 'Toyota', model: 'Avanza', year: 2019, vehicle_type: 'mobil', color: 'Silver', odometer: 57200 },
  { owner: 1, plate_number: 'BB 8812 CD', brand: 'Yamaha', model: 'NMAX', year: 2022, vehicle_type: 'motor', color: 'Hitam', odometer: 9900 },
  { owner: 2, plate_number: 'BK 7788 XY', brand: 'Suzuki', model: 'Ertiga', year: 2020, vehicle_type: 'mobil', color: 'Abu-abu', odometer: 49800 },
  { owner: 2, plate_number: 'BB 3345 EF', brand: 'Honda', model: 'Vario 160', year: 2023, vehicle_type: 'motor', color: 'Merah', odometer: 4200 },
];

// [indeks kendaraan, nama layanan, hari lalu, odometer, biaya suku cadang, pekerjaan]
const PAST_SERVICES = [
  [2, 'Servis Besar Motor', 190, 6100, 180000, 'Ganti busi, kuras injektor, setel katup, dan ganti kampas kopling.'],
  [0, 'Ganti Oli Mesin Motor', 170, 9800, 45000, 'Ganti oli mesin 0,8 liter dan cek kebocoran.'],
  [3, 'Tune Up Mobil', 160, 41000, 220000, 'Ganti busi, bersihkan throttle body, dan setel mesin.'],
  [1, 'Servis Berkala Mobil', 150, 52000, 520000, 'Ganti oli, filter oli, filter udara, dan cek 40 titik.'],
  [2, 'Servis Ringan Motor', 130, 8200, 35000, 'Bersihkan filter udara, setel rantai, dan cek kelistrikan.'],
  [0, 'Servis Ringan Motor', 110, 12100, 30000, 'Bersihkan filter udara dan setel rem.'],
  [1, 'Ganti Oli Mesin Mobil', 95, 55000, 240000, 'Ganti oli mesin 3,5 liter dan filter oli.'],
  [3, 'Servis Berkala Mobil', 75, 47000, 560000, 'Servis berkala 10.000 km dan ganti filter kabin.'],
  [0, 'Ganti Oli Mesin Motor', 40, 14000, 45000, 'Ganti oli mesin 0,8 liter.'],
  [1, 'Ganti Kampas Rem', 30, 56000, 190000, 'Ganti kampas rem depan dan bersihkan kaliper.'],
  [3, 'Spooring dan Balancing', 12, 49000, 0, 'Spooring dan balancing keempat roda.'],
];

// [indeks kendaraan, nama layanan, selisih hari dari hari ini, jam, status, keluhan]
const UPCOMING = [
  [0, 'Ganti Oli Mesin Motor', 2, '09:00', BOOKING_STATUS.CONFIRMED, 'Oli sudah hampir 2.000 km.'],
  [2, 'Servis Ringan Motor', 3, '10:00', BOOKING_STATUS.PENDING, 'Tarikan terasa berat.'],
  [4, 'Ganti Oli Mesin Motor', 4, '13:00', BOOKING_STATUS.PENDING, null],
  [3, 'Servis AC Mobil', 0, '08:00', BOOKING_STATUS.IN_PROGRESS, 'AC kurang dingin.'],
  [1, 'Servis AC Mobil', -3, '14:00', BOOKING_STATUS.CANCELLED, 'Dibatalkan karena jadwal bentrok.'],
];

const hash = (password) => bcrypt.hashSync(password, env.bcryptRounds);

const ensureAdmin = () => {
  if (userRepository.findByEmail(env.admin.email)) return;
  userRepository.create({
    name: env.admin.name,
    email: env.admin.email.toLowerCase(),
    phone: null,
    passwordHash: hash(env.admin.password),
    role: ROLES.ADMIN,
  });
};

const ensureServices = () => {
  SERVICES.forEach((service) => {
    if (!serviceRepository.findByName(service.name)) serviceRepository.create({ ...service, is_active: true });
  });
};

const seedPastServices = (vehicles) => {
  PAST_SERVICES.forEach(([vehicleIndex, serviceName, daysAgo, odometer, partsCost, workDone]) => {
    const vehicle = vehicles[vehicleIndex];
    const service = serviceRepository.findByName(serviceName);
    const serviceDate = addDays(todayISO(), -daysAgo);
    const booking = bookingRepository.create({
      userId: vehicle.user_id,
      vehicle_id: vehicle.id,
      service_id: service.id,
      booking_date: serviceDate,
      time_slot: '09:00',
      odometer,
      complaint: null,
      estimatedPrice: service.price,
    });
    bookingRepository.updateStatus(booking.id, BOOKING_STATUS.COMPLETED);
    historyRepository.create({
      booking_id: booking.id,
      vehicle_id: vehicle.id,
      user_id: vehicle.user_id,
      service_id: service.id,
      service_date: serviceDate,
      odometer,
      work_done: workDone,
      parts_cost: partsCost,
      labor_cost: service.price,
      total_cost: partsCost + service.price,
      next_service_date: service.interval_days ? addDays(serviceDate, service.interval_days) : null,
      next_service_km: service.interval_km ? odometer + service.interval_km : null,
      notes: null,
    });
  });
};

const seedUpcoming = (vehicles) => {
  UPCOMING.forEach(([vehicleIndex, serviceName, offset, slot, status, complaint]) => {
    const vehicle = vehicles[vehicleIndex];
    const service = serviceRepository.findByName(serviceName);
    const booking = bookingRepository.create({
      userId: vehicle.user_id,
      vehicle_id: vehicle.id,
      service_id: service.id,
      booking_date: addDays(todayISO(), offset),
      time_slot: slot,
      odometer: vehicle.odometer,
      complaint,
      estimatedPrice: service.price,
    });
    if (status !== BOOKING_STATUS.PENDING) bookingRepository.updateStatus(booking.id, status);
  });
};

const seedDemoData = () => {
  const customers = CUSTOMERS.map((customer) =>
    userRepository.create({ ...customer, passwordHash: hash(DEMO_PASSWORD), role: ROLES.CUSTOMER }),
  );
  const vehicles = VEHICLES.map(({ owner, ...vehicle }) => vehicleRepository.create(customers[owner].id, vehicle));
  seedPastServices(vehicles);
  seedUpcoming(vehicles);
};

/** Isi data awal hanya jika database masih kosong (aman dipanggil tiap server start). */
const seedIfEmpty = () => {
  const db = getDb();
  db.transaction(() => {
    ensureAdmin();
    ensureServices();
    const hasCustomers = userRepository.count() > 1;
    if (env.seedDemoData && !hasCustomers) seedDemoData();
  })();
};

const resetDatabase = () => {
  const db = getDb();
  db.pragma('foreign_keys = OFF');
  ['service_history', 'bookings', 'vehicles', 'services', 'users'].forEach((table) => {
    db.exec(`DELETE FROM ${table}; DELETE FROM sqlite_sequence WHERE name = '${table}';`);
  });
  db.pragma('foreign_keys = ON');
};

if (require.main === module) {
  if (process.argv.includes('--reset')) resetDatabase();
  seedIfEmpty();
  console.log('Seed selesai.');
  console.log(`Admin    : ${env.admin.email} / ${env.admin.password}`);
  console.log(`Customer : budi@example.com / ${DEMO_PASSWORD}`);
  closeDb();
}

module.exports = { seedIfEmpty, resetDatabase, DEMO_PASSWORD };
