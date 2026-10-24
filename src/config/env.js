require('dotenv').config({ quiet: true });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const DEV_SECRET = 'dev-only-secret-change-me';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 8000),
  dbPath: process.env.DB_PATH || 'data/bengkelku.sqlite',
  jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  slotCapacity: toInt(process.env.SLOT_CAPACITY, 2),
  timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
  autoSeed: process.env.AUTO_SEED !== 'false',
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
  admin: {
    name: process.env.ADMIN_NAME || 'Admin BengkelKu',
    email: process.env.ADMIN_EMAIL || 'admin@bengkelku.id',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
};

if (env.nodeEnv === 'production' && env.jwtSecret === DEV_SECRET) {
  throw new Error('JWT_SECRET wajib diisi saat NODE_ENV=production');
}

module.exports = env;
