module.exports = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL UNIQUE,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  year         INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motor', 'mobil')),
  color        TEXT,
  odometer     INTEGER NOT NULL DEFAULT 0 CHECK (odometer >= 0),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

CREATE TABLE IF NOT EXISTS services (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL UNIQUE,
  description      TEXT,
  vehicle_type     TEXT NOT NULL DEFAULT 'semua' CHECK (vehicle_type IN ('motor', 'mobil', 'semua')),
  price            INTEGER NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  interval_days    INTEGER CHECK (interval_days IS NULL OR interval_days > 0),
  interval_km      INTEGER CHECK (interval_km IS NULL OR interval_km > 0),
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  vehicle_id      INTEGER NOT NULL REFERENCES vehicles(id),
  service_id      INTEGER NOT NULL REFERENCES services(id),
  booking_date    TEXT NOT NULL,
  time_slot       TEXT NOT NULL,
  odometer        INTEGER CHECK (odometer IS NULL OR odometer >= 0),
  complaint       TEXT,
  estimated_price INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  admin_note      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(booking_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS service_history (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id        INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  vehicle_id        INTEGER NOT NULL REFERENCES vehicles(id),
  user_id           INTEGER NOT NULL REFERENCES users(id),
  service_id        INTEGER NOT NULL REFERENCES services(id),
  service_date      TEXT NOT NULL,
  odometer          INTEGER NOT NULL CHECK (odometer >= 0),
  work_done         TEXT NOT NULL,
  parts_cost        INTEGER NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
  labor_cost        INTEGER NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  total_cost        INTEGER NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  next_service_date TEXT,
  next_service_km   INTEGER,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_vehicle ON service_history(vehicle_id, service_date);
CREATE INDEX IF NOT EXISTS idx_history_user ON service_history(user_id);
`;
