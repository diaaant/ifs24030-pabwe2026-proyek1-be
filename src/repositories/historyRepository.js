const { getDb } = require('../db/connection');

const DETAIL_SELECT = `
  SELECT h.*, b.code AS booking_code, b.complaint,
         v.plate_number, v.brand AS vehicle_brand, v.model AS vehicle_model, v.vehicle_type,
         s.name AS service_name,
         u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
  FROM service_history h
  JOIN bookings b ON b.id = h.booking_id
  JOIN vehicles v ON v.id = h.vehicle_id
  JOIN services s ON s.id = h.service_id
  JOIN users u ON u.id = h.user_id`;

const buildFilter = ({ userId, vehicleId }) => {
  const clauses = [];
  const params = {};
  if (userId) {
    clauses.push('h.user_id = @userId');
    params.userId = userId;
  }
  if (vehicleId) {
    clauses.push('h.vehicle_id = @vehicleId');
    params.vehicleId = vehicleId;
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

const findById = (id) => getDb().prepare(`${DETAIL_SELECT} WHERE h.id = ?`).get(id);

const list = ({ limit, offset, ...filter }) => {
  const { where, params } = buildFilter(filter);
  return getDb()
    .prepare(`${DETAIL_SELECT} ${where} ORDER BY h.service_date DESC, h.id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
};

const count = (filter) => {
  const { where, params } = buildFilter(filter);
  return getDb().prepare(`SELECT COUNT(*) AS total FROM service_history h ${where}`).get(params).total;
};

const listByVehicle = (vehicleId) =>
  getDb()
    .prepare(`${DETAIL_SELECT} WHERE h.vehicle_id = ? ORDER BY h.service_date DESC, h.id DESC`)
    .all(vehicleId);

const create = (data) => {
  const info = getDb()
    .prepare(
      `INSERT INTO service_history
         (booking_id, vehicle_id, user_id, service_id, service_date, odometer, work_done,
          parts_cost, labor_cost, total_cost, next_service_date, next_service_km, notes)
       VALUES
         (@booking_id, @vehicle_id, @user_id, @service_id, @service_date, @odometer, @work_done,
          @parts_cost, @labor_cost, @total_cost, @next_service_date, @next_service_km, @notes)`,
    )
    .run(data);
  return findById(info.lastInsertRowid);
};

/** Servis terakhir tiap kendaraan beserta jadwal servis berikutnya. */
const latestPerVehicle = (userId) =>
  getDb()
    .prepare(
      `SELECT v.id AS vehicle_id, v.plate_number, v.brand, v.model, v.vehicle_type, v.odometer,
              v.user_id, u.name AS owner_name,
              h.service_date AS last_service_date, h.next_service_date, h.next_service_km,
              s.name AS last_service_name
       FROM vehicles v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN service_history h ON h.id = (
         SELECT id FROM service_history WHERE vehicle_id = v.id ORDER BY service_date DESC, id DESC LIMIT 1
       )
       LEFT JOIN services s ON s.id = h.service_id
       WHERE (@userId IS NULL OR v.user_id = @userId)
       ORDER BY v.plate_number`,
    )
    .all({ userId: userId ?? null });

module.exports = { findById, list, count, listByVehicle, create, latestPerVehicle };
