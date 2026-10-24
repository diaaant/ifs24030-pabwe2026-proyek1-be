const crypto = require('node:crypto');
const { getDb } = require('../db/connection');
const { ACTIVE_STATUSES } = require('../config/constants');
const { compact } = require('../utils/dates');

const ACTIVE_SQL = ACTIVE_STATUSES.map((status) => `'${status}'`).join(', ');

const DETAIL_SELECT = `
  SELECT b.*,
         v.plate_number, v.brand AS vehicle_brand, v.model AS vehicle_model, v.vehicle_type, v.odometer AS vehicle_odometer,
         s.name AS service_name, s.duration_minutes AS service_duration, s.price AS service_price,
         u.name AS customer_name, u.phone AS customer_phone
  FROM bookings b
  JOIN vehicles v ON v.id = b.vehicle_id
  JOIN services s ON s.id = b.service_id
  JOIN users u ON u.id = b.user_id`;

const buildFilter = ({ userId, status, date, search }) => {
  const clauses = [];
  const params = {};
  if (userId) {
    clauses.push('b.user_id = @userId');
    params.userId = userId;
  }
  if (status) {
    clauses.push('b.status = @status');
    params.status = status;
  }
  if (date) {
    clauses.push('b.booking_date = @date');
    params.date = date;
  }
  if (search) {
    clauses.push('(b.code LIKE @q OR v.plate_number LIKE @q OR s.name LIKE @q OR u.name LIKE @q)');
    params.q = `%${search}%`;
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

const generateCode = (date) => `BK-${compact(date)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const findById = (id) => getDb().prepare(`${DETAIL_SELECT} WHERE b.id = ?`).get(id);

const list = ({ limit, offset, ...filter }) => {
  const { where, params } = buildFilter(filter);
  return getDb()
    .prepare(`${DETAIL_SELECT} ${where} ORDER BY b.booking_date DESC, b.time_slot DESC, b.id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
};

const count = (filter) => {
  const { where, params } = buildFilter(filter);
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS total FROM bookings b
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.user_id ${where}`,
    )
    .get(params).total;
};

const create = (data) => {
  const info = getDb()
    .prepare(
      `INSERT INTO bookings (code, user_id, vehicle_id, service_id, booking_date, time_slot, odometer, complaint, estimated_price)
       VALUES (@code, @userId, @vehicle_id, @service_id, @booking_date, @time_slot, @odometer, @complaint, @estimatedPrice)`,
    )
    .run({ code: generateCode(data.booking_date), odometer: null, ...data });
  return findById(info.lastInsertRowid);
};

const updateStatus = (id, status, adminNote) => {
  getDb()
    .prepare(
      "UPDATE bookings SET status = ?, admin_note = COALESCE(?, admin_note), updated_at = datetime('now') WHERE id = ?",
    )
    .run(status, adminNote ?? null, id);
  return findById(id);
};

/** Jumlah booking aktif per jam pada satu tanggal. */
const countActiveBySlot = (date) =>
  getDb()
    .prepare(
      `SELECT time_slot, COUNT(*) AS total FROM bookings
       WHERE booking_date = ? AND status IN (${ACTIVE_SQL}) GROUP BY time_slot`,
    )
    .all(date);

const countActiveInSlot = (date, slot) =>
  getDb()
    .prepare(`SELECT COUNT(*) AS total FROM bookings WHERE booking_date = ? AND time_slot = ? AND status IN (${ACTIVE_SQL})`)
    .get(date, slot).total;

const hasActiveForVehicleOnDate = (vehicleId, date) =>
  Boolean(
    getDb()
      .prepare(`SELECT 1 FROM bookings WHERE vehicle_id = ? AND booking_date = ? AND status IN (${ACTIVE_SQL}) LIMIT 1`)
      .get(vehicleId, date),
  );

module.exports = {
  findById,
  list,
  count,
  create,
  updateStatus,
  countActiveBySlot,
  countActiveInSlot,
  hasActiveForVehicleOnDate,
};
