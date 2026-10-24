const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(new AppError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
};

const SQLITE_CONSTRAINT = 'SQLITE_CONSTRAINT';

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Format JSON tidak valid' });
  }

  if (typeof err.code === 'string' && err.code.startsWith(SQLITE_CONSTRAINT)) {
    return res.status(409).json({ success: false, message: 'Data melanggar batasan basis data' });
  }

  if (env.nodeEnv !== 'test') console.error(err);
  return res.status(500).json({
    success: false,
    message: env.nodeEnv === 'production' ? 'Terjadi kesalahan pada server' : err.message,
  });
};

module.exports = { notFound, errorHandler };
