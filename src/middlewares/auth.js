const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

/** Verifikasi JWT lalu pasang data user terbaru dari database pada `req.user`. */
const authenticate = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(new AppError(401, 'Token autentikasi tidak ditemukan'));

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return next(new AppError(401, 'Token tidak valid atau sudah kedaluwarsa'));
  }

  const user = userRepository.findById(Number(payload.sub));
  if (!user) return next(new AppError(401, 'Akun tidak ditemukan'));

  req.user = user;
  return next();
};

/** Batasi akses endpoint berdasarkan role. */
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, 'Anda tidak memiliki akses ke sumber daya ini'));
  }
  return next();
};

module.exports = { authenticate, authorize };
