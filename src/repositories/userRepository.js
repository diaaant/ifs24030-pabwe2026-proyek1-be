const { getDb } = require('../db/connection');

const PUBLIC_COLUMNS = 'id, name, email, phone, role, created_at, updated_at';

const findById = (id) =>
  getDb().prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id);

const findByEmail = (email) =>
  getDb().prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`).get(email);

/** Khusus autentikasi: menyertakan password_hash. */
const findCredentialsByEmail = (email) =>
  getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);

const findCredentialsById = (id) =>
  getDb().prepare('SELECT id, password_hash FROM users WHERE id = ?').get(id);

const create = ({ name, email, phone, passwordHash, role }) => {
  const info = getDb()
    .prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, phone, passwordHash, role);
  return findById(info.lastInsertRowid);
};

const updateProfile = (id, { name, phone }) => {
  getDb()
    .prepare("UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, phone, id);
  return findById(id);
};

const updatePassword = (id, passwordHash) => {
  getDb()
    .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(passwordHash, id);
};

const buildSearch = (search) => (search ? { where: 'WHERE name LIKE @q OR email LIKE @q', params: { q: `%${search}%` } } : { where: '', params: {} });

const list = ({ search, limit, offset }) => {
  const { where, params } = buildSearch(search);
  return getDb()
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM users ${where} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
};

const count = (search) => {
  const { where, params } = buildSearch(search);
  return getDb().prepare(`SELECT COUNT(*) AS total FROM users ${where}`).get(params).total;
};

module.exports = {
  findById,
  findByEmail,
  findCredentialsByEmail,
  findCredentialsById,
  create,
  updateProfile,
  updatePassword,
  list,
  count,
};
