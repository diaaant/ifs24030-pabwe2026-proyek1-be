const { getDb } = require('../db/connection');

const findById = (id) => getDb().prepare('SELECT * FROM services WHERE id = ?').get(id);

const findByName = (name) => getDb().prepare('SELECT * FROM services WHERE name = ?').get(name);

const list = ({ vehicleType, includeInactive }) => {
  const clauses = [];
  const params = {};
  if (!includeInactive) clauses.push('is_active = 1');
  if (vehicleType) {
    clauses.push("(vehicle_type = @vehicleType OR vehicle_type = 'semua')");
    params.vehicleType = vehicleType;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return getDb().prepare(`SELECT * FROM services ${where} ORDER BY vehicle_type, name`).all(params);
};

const toRow = (data) => ({ ...data, is_active: data.is_active ? 1 : 0 });

const create = (data) => {
  const info = getDb()
    .prepare(
      `INSERT INTO services (name, description, vehicle_type, price, duration_minutes, interval_days, interval_km, is_active)
       VALUES (@name, @description, @vehicle_type, @price, @duration_minutes, @interval_days, @interval_km, @is_active)`,
    )
    .run(toRow(data));
  return findById(info.lastInsertRowid);
};

const update = (id, data) => {
  getDb()
    .prepare(
      `UPDATE services SET name = @name, description = @description, vehicle_type = @vehicle_type, price = @price,
         duration_minutes = @duration_minutes, interval_days = @interval_days, interval_km = @interval_km,
         is_active = @is_active, updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ id, ...toRow(data) });
  return findById(id);
};

const deactivate = (id) => {
  getDb().prepare("UPDATE services SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
};

const remove = (id) => getDb().prepare('DELETE FROM services WHERE id = ?').run(id);

const countBookings = (id) =>
  getDb().prepare('SELECT COUNT(*) AS total FROM bookings WHERE service_id = ?').get(id).total;

module.exports = { findById, findByName, list, create, update, deactivate, remove, countBookings };
