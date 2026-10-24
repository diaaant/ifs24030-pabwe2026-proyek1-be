const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite'); // Modul bawaan Node.js
const env = require('../config/env');
const schema = require('./schema');

let db = null;

/** Koneksi SQLite tunggal (lazy) dengan foreign key aktif dan skema siap pakai. */
const getDb = () => {
  if (db) return db;

  if (env.dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(env.dbPath)), { recursive: true });
  }

  db = new DatabaseSync(env.dbPath);
  
  // node:sqlite tidak memiliki method .pragma(), gunakan .exec()
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schema);

  // ⚠️ POLYFILL: Menambahkan fungsi .transaction() agar kompatibel dengan better-sqlite3
  // Ini agar kode di seed.js dan repository lain tidak perlu diubah
  db.transaction = (fn) => {
    return function (...args) {
      db.exec('BEGIN');
      try {
        const result = fn(...args);
        db.exec('COMMIT');
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    };
  };
  
  return db;
};

const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { getDb, closeDb };