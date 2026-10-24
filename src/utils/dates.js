const env = require('../config/env');

const DAY_MS = 86400000;
const toUtc = (iso) => Date.parse(`${iso}T00:00:00Z`);

/** Tanggal hari ini (YYYY-MM-DD) pada zona waktu aplikasi. */
const todayISO = (now = new Date(), timeZone = env.timezone) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

const addDays = (iso, days) => new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);

const diffDays = (fromIso, toIso) => Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);

const weekday = (iso) => new Date(toUtc(iso)).getUTCDay();

const compact = (iso) => iso.replaceAll('-', '');

/** Geser bulan (format YYYY-MM) maju/mundur. */
const shiftMonth = (yearMonth, delta) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
};

module.exports = { todayISO, addDays, diffDays, weekday, compact, shiftMonth };
