const { getDb } = require('../db/connection');

const SELECT_WITH_OWNER = `
  SELECT v.*, u.name AS owner_name
  FROM vehicles v
  JOIN users u ON u.id = v.user_id`;

const buildFilter = ({ userId, search, vehicleType }) => {
  const clauses = [];
  const params = {};
  if (userId) {
    clauses.push('v.user_id = @userId');
    params.userId = userId;
  }
  if (search) {
    clauses.push('(v.plate_number LIKE @q OR v.brand LIKE @q OR v.model LIKE @q OR u.name LIKE @q)');
    params.q = `%${search}%`;
  }
  if (vehicleType) {
    clauses.push('v.vehicle_type = @vehicleType');
    params.vehicleType = vehicleType;
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

const findById = (id) => getDb().prepare(`${SELECT_WITH_OWNER} WHERE v.id = ?`).get(id);

const findByPlate = (plateNumber) =>
  getDb().prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(plateNumber);

const list = ({ limit, offset, ...filter }) => {
  const { where, params } = buildFilter(filter);
  return getDb()
    .prepare(`${SELECT_WITH_OWNER} ${where} ORDER BY v.created_at DESC, v.id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
};

const count = (filter) => {
  const { where, params } = buildFilter(filter);
  return getDb()
    .prepare(`SELECT COUNT(*) AS total FROM vehicles v JOIN users u ON u.id = v.user_id ${where}`)
    .get(params).total;
};

const create = (userId, data) => {
  const info = getDb()
    .prepare(
      `INSERT INTO vehicles (user_id, plate_number, brand, model, year, vehicle_type, color, odometer)
       VALUES (@userId, @plate_number, @brand, @model, @year, @vehicle_type, @color, @odometer)`,
    )
    .run({ userId, ...data });
  return findById(info.lastInsertRowid);
};

const update = (id, data) => {
  getDb()
    .prepare(
      `UPDATE vehicles SET plate_number = @plate_number, brand = @brand, model = @model, year = @year,
         vehicle_type = @vehicle_type, color = @color, odometer = @odometer, updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ id, ...data });
  return findById(id);
};

/** Odometer hanya boleh naik. */
const raiseOdometer = (id, odometer) => {
  getDb()
    .prepare("UPDATE vehicles SET odometer = MAX(odometer, ?), updated_at = datetime('now') WHERE id = ?")
    .run(odometer, id);
};

const remove = (id) => getDb().prepare('DELETE FROM vehicles WHERE id = ?').run(id);

const countBookings = (id) =>
  getDb().prepare('SELECT COUNT(*) AS total FROM bookings WHERE vehicle_id = ?').get(id).total;

module.exports = {
  findById,
  findByPlate,
  list,
  count,
  create,
  update,
  raiseOdometer,
  remove,
  countBookings,
};
