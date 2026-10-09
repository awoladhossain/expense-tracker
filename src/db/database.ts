/**
 * Expense Tracker — SQLite Database Initialization and Migration System
 */

import * as SQLite from 'expo-sqlite';
import { DB_NAME, DB_VERSION } from '@/constants/config';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

let _db: SQLite.SQLiteDatabase | null = null;
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndInitialize().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

async function openAndInitialize(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeDatabase(db);
  _db = db;
  return db;
}

async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS db_meta (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  const currentVersion = await getDBVersion(db);
  if (currentVersion === 0) {
    await createSchema(db);
    await seedDefaultCategories(db);
    await setDBVersion(db, DB_VERSION);
  } else if (currentVersion < DB_VERSION) {
    await runMigrations(db, currentVersion, DB_VERSION);
    await setDBVersion(db, DB_VERSION);
  }
}

async function createSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en      TEXT NOT NULL,
      name_bn      TEXT NOT NULL,
      icon         TEXT NOT NULL,
      color        TEXT NOT NULL,
      is_default   INTEGER NOT NULL DEFAULT 0,
      budget_limit REAL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL CHECK(amount > 0),
      category_id INTEGER NOT NULL,
      type        TEXT    NOT NULL CHECK(type IN ('expense', 'income')),
      note        TEXT,
      date        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      synced      INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      month       TEXT    NOT NULL,
      total_limit REAL    NOT NULL CHECK(total_limit > 0),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(month)
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);
  `);
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_default = 1;'
  );
  if (existing && existing.count > 0) return;
  await db.withTransactionAsync(async () => {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name_en, name_bn, icon, color, is_default, budget_limit) VALUES (?, ?, ?, ?, ?, ?);`,
        [cat.name_en, cat.name_bn, cat.icon, cat.color, cat.is_default, cat.budget_limit]
      );
    }
  });
}

async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    switch (v) {
      default: break;
    }
  }
}

async function getDBVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM db_meta WHERE key = 'version';`);
  return row ? parseInt(row.value, 10) : 0;
}

async function setDBVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(`INSERT OR REPLACE INTO db_meta (key, value) VALUES ('version', ?);`, [String(version)]);
}

export async function closeDatabase(): Promise<void> {
  const db = _db;
  _db = null;
  databasePromise = null;
  if (db) await db.closeAsync();
}
