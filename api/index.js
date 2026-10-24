// Pintu masuk untuk Vercel (serverless). Di lokal/Docker tetap pakai src/server.js.
// Bila aplikasi gagal start, penyebabnya ditampilkan sebagai JSON agar mudah didiagnosis.
let app;
let startupError = null;

try {
  const env = require('../src/config/env');
  const { createApp } = require('../src/app');
  const { seedIfEmpty } = require('../src/db/seed');

  if (env.autoSeed) seedIfEmpty();
  app = createApp();
} catch (error) {
  startupError = error;
  console.error('Gagal memulai aplikasi:', error);
}

module.exports = (req, res) => {
  if (startupError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Aplikasi gagal start',
        error: String(startupError && startupError.message),
        code: startupError && startupError.code,
      }),
    );
    return;
  }
  app(req, res);
};
