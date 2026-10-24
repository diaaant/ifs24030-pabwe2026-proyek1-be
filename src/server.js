const env = require('./config/env');
const { createApp } = require('./app');
const { closeDb } = require('./db/connection');
const { seedIfEmpty } = require('./db/seed');

if (env.autoSeed) seedIfEmpty();

const server = createApp().listen(env.port, () => {
  console.log(`BengkelKu API berjalan di http://localhost:${env.port} (docs: /api/docs)`);
});

const shutdown = () => {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
