const { ROLES } = require('../config/constants');
const AppError = require('./AppError');

const isAdmin = (user) => user.role === ROLES.ADMIN;

/**
 * Pastikan data hanya diakses pemiliknya (atau admin).
 * Mengembalikan 404 agar keberadaan data milik orang lain tidak bocor.
 */
const assertOwnerOrAdmin = (user, ownerId, notFoundMessage = 'Data tidak ditemukan') => {
  if (isAdmin(user) || user.id === ownerId) return;
  throw new AppError(404, notFoundMessage);
};

module.exports = { assertOwnerOrAdmin, isAdmin };
