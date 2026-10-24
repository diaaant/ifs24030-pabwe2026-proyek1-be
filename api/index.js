// Pintu masuk untuk Vercel (serverless). Di lokal/Docker tetap pakai src/server.js.
const env = require('../src/config/env');
const { createApp } = require('../src/app');
const { seedIfEmpty } = require('../src/db/seed');

if (env.autoSeed) seedIfEmpty();

module.exports = createApp();
