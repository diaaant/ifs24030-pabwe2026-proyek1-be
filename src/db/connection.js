const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const env = require('../config/env');
const schema = require('./schema');

let db = null;

/** Koneksi SQLite tunggal (lazy) dengan foreign key aktif dan skema siap pakai. */
const getDb = () => {
  if (db) return db;

  if (env.dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(env.dbPath)), { recursive: true });
  }

  db = new Database(env.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
};

const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { getDb, closeDb };
