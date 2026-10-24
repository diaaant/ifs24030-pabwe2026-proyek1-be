const { todayISO, addDays, diffDays, weekday, shiftMonth, compact } = require('../src/utils/dates');
const { toReminder } = require('../src/services/reminderService');
const { toPaging } = require('../src/utils/pagination');
const { buildMeta } = require('../src/utils/response');

// Tambahan import untuk tes database connection
const { getDb, closeDb } = require('../src/db/connection');
const env = require('../src/config/env');
const fs = require('node:fs');
const path = require('node:path');

describe('utils/dates', () => {
  test('operasi tanggal tidak terpengaruh zona waktu', () => {
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(diffDays('2026-10-21', '2026-10-25')).toBe(4);
    expect(weekday('2026-10-25')).toBe(0);
    expect(shiftMonth('2026-01', -2)).toBe('2025-11');
    expect(compact('2026-10-21')).toBe('20261021');
  });

  test('todayISO memakai zona waktu yang diminta', () => {
    const instant = new Date('2026-10-21T20:00:00Z');
    expect(todayISO(instant, 'Asia/Jakarta')).toBe('2026-10-22');
    expect(todayISO(instant, 'UTC')).toBe('2026-10-21');
  });
});

describe('reminderService.toReminder', () => {
  const base = { odometer: 10000, last_service_date: '2026-08-01' };

  test.each([
    ['overdue karena tanggal lewat', { next_service_date: '2026-10-01', next_service_km: 20000 }, 'overdue'],
    ['overdue karena kilometer lewat', { next_service_date: '2027-01-01', next_service_km: 9000 }, 'overdue'],
    ['soon karena tanggal dekat', { next_service_date: '2026-10-30', next_service_km: 20000 }, 'soon'],
    ['soon karena kilometer dekat', { next_service_date: '2027-01-01', next_service_km: 10200 }, 'soon'],
    ['ok jika masih jauh', { next_service_date: '2027-01-01', next_service_km: 15000 }, 'ok'],
    ['ok jika tanpa jadwal berikutnya', { next_service_date: null, next_service_km: null }, 'ok'],
  ])('%s', (_label, row, expected) => {
    expect(toReminder({ ...base, ...row }, '2026-10-21').status).toBe(expected);
  });

  test('tanpa riwayat servis', () => {
    expect(toReminder({ last_service_date: null }, '2026-10-21')).toMatchObject({ status: 'no_history', days_left: null });
  });
});

describe('pagination', () => {
  test('menghitung offset dan meta', () => {
    expect(toPaging({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, offset: 20 });
    expect(buildMeta(1, 10, 0).totalPages).toBe(1);
    expect(buildMeta(1, 10, 25).totalPages).toBe(3);
  });
});

// ==========================================
// TAMBAHAN TES UNTUK 100% COVERAGE CONNECTION
// ==========================================
describe('Database Connection Edge Cases', () => {
  afterEach(() => {
    closeDb();
    // Pastikan env kembali ke memory agar tes lain tidak terganggu
    env.dbPath = ':memory:';
  });

  it('harus membuat direktori database dan melakukan rollback saat error', () => {
    const testDbPath = path.join(__dirname, 'temp-test.sqlite');
    env.dbPath = testDbPath;

    const db = getDb();
    expect(fs.existsSync(testDbPath)).toBe(true);

    // Uji blok catch (rollback) pada transaksi
    const tx = db.transaction(() => {
      throw new Error('Force Rollback');
    });
    expect(() => tx()).toThrow('Force Rollback');

    // ⚠️ JANGAN gunakan db.close() manual!
    // Gunakan closeDb() agar baris 46 di connection.js tereksekusi.
    closeDb();

    // Bersihkan file database sementara setelah ditutup
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
    if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
  });
});