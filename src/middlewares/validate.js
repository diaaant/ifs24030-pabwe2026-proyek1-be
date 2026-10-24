const AppError = require('../utils/AppError');

const SOURCES = ['params', 'query', 'body'];

/**
 * Validasi request dengan skema zod. Hasil parse disimpan di `req.valid`
 * (req.query pada Express 5 bersifat read-only).
 */
const validate = (schemas) => (req, _res, next) => {
  const valid = {};
  const errors = [];

  SOURCES.forEach((source) => {
    if (!schemas[source]) return;
    const result = schemas[source].safeParse(req[source] ?? {});
    if (result.success) {
      valid[source] = result.data;
      return;
    }
    result.error.issues.forEach((issue) => {
      errors.push({ field: issue.path.join('.') || source, message: issue.message });
    });
  });

  if (errors.length > 0) return next(new AppError(422, 'Validasi gagal', errors));

  req.valid = valid;
  return next();
};

module.exports = validate;
