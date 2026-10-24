const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { mountDocs } = require('./docs/swagger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = !origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin);
    callback(null, allowed);
  },
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi beberapa menit lagi' },
});

const createApp = () => {
  const app = express();
  app.disable('x-powered-by');

  // Swagger UI memakai skrip inline, jadi dipasang sebelum helmet.
  mountDocs(app);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('tiny'));

  app.use('/api/auth', authLimiter);
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};

module.exports = { createApp };
