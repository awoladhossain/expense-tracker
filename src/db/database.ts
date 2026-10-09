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
  } else {
    // Self-healing migration: Ensure columns and income categories always exist
    await ensureCategoriesSchema(db);
    if (currentVersion < DB_VERSION) {
      await runMigrations(db, currentVersion, DB_VERSION);
      await setDBVersion(db, DB_VERSION);
    }
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
      type         TEXT NOT NULL DEFAULT 'expense',
      is_default   INTEGER NOT NULL DEFAULT 0,
      budget_limit REAL,
      is_deleted   INTEGER NOT NULL DEFAULT 0,
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
    CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);
    CREATE INDEX IF NOT EXISTS idx_categories_type        ON categories(type, is_deleted);
  `);
}

async function ensureCategoriesSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(categories);');
    const columns = new Set(tableInfo.map((col) => col.name));

    if (!columns.has('type')) {
      await db.execAsync(
        `ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';`
      );
    }

    if (!columns.has('is_deleted')) {
      await db.execAsync(
        `ALTER TABLE categories ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;`
      );
    }

    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type, is_deleted);`
    );

    // Seed missing income categories idempotently
    await seedIncomeCategories(db);
  } catch (err) {
    console.warn('ensureCategoriesSchema encountered an issue:', err);
  }
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_default = 1;'
  );
  if (existing && existing.count > 0) return;
  await db.withTransactionAsync(async () => {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name_en, name_bn, icon, color, type, is_default, budget_limit, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [cat.name_en, cat.name_bn, cat.icon, cat.color, cat.type, cat.is_default, cat.budget_limit, cat.is_deleted]
      );
    }
  });
}

async function seedIncomeCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const incomeCategories = DEFAULT_CATEGORIES.filter((cat) => cat.type === 'income');
  for (const cat of incomeCategories) {
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM categories WHERE name_en = ? AND type = 'income' LIMIT 1;`,
      [cat.name_en]
    );
    if (!existing) {
      await db.runAsync(
        `INSERT INTO categories (name_en, name_bn, icon, color, type, is_default, budget_limit, is_deleted)
         VALUES (?, ?, ?, ?, ?, 1, NULL, 0);`,
        [cat.name_en, cat.name_bn, cat.icon, cat.color, cat.type]
      );
    }
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (v === 2) {
      await ensureCategoriesSchema(db);
    }
  }
}

async function getDBVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const pragmaRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    if (pragmaRow && typeof pragmaRow.user_version === 'number' && pragmaRow.user_version > 0) {
      return pragmaRow.user_version;
    }
  } catch {}

  try {
    const metaRow = await db.getFirstAsync<{ value: string }>(`SELECT value FROM db_meta WHERE key = 'version';`);
    return metaRow ? parseInt(metaRow.value, 10) : 0;
  } catch {
    return 0;
  }
}

async function setDBVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  try {
    await db.execAsync(`PRAGMA user_version = ${version};`);
  } catch {}
  try {
    await db.runAsync(`INSERT OR REPLACE INTO db_meta (key, value) VALUES ('version', ?);`, [String(version)]);
  } catch {}
}

export async function closeDatabase(): Promise<void> {
  const db = _db;
  _db = null;
  databasePromise = null;
  if (db) await db.closeAsync();
}
