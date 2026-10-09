/**
 * Expense Tracker — Transactions DB CRUD
 */

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDatabase } from './database';
import type { MonthString, DateString } from '@/utils/date';

export type TransactionType = 'expense' | 'income';

export interface TransactionRow {
  id: number;
  amount: number;
  category_id: number;
  type: TransactionType;
  note: string | null;
  date: DateString;
  created_at: string;
  updated_at: string;
  synced: 0 | 1;
  category_name_en?: string;
  category_name_bn?: string;
  category_icon?: string;
  category_color?: string;
}

export type NewTransaction = {
  amount: number;
  category_id: number;
  type: TransactionType;
  note?: string | null;
  date: DateString;
};

const WITH_CATEGORY = `
  SELECT t.*, c.name_en AS category_name_en, c.name_bn AS category_name_bn,
         c.icon AS category_icon, c.color AS category_color
  FROM transactions t JOIN categories c ON c.id = t.category_id
`;

export async function insertTransaction(tx: NewTransaction): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO transactions (amount, category_id, type, note, date) VALUES (?, ?, ?, ?, ?);`,
    [tx.amount, tx.category_id, tx.type, tx.note ?? null, tx.date]
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(id: number, updates: Partial<NewTransaction>): Promise<void> {
  const db = await getDatabase();
  const assignments: string[] = [];
  const values: SQLiteBindValue[] = [];

  if (updates.amount !== undefined) {
    assignments.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.category_id !== undefined) {
    assignments.push('category_id = ?');
    values.push(updates.category_id);
  }
  if (updates.type !== undefined) {
    assignments.push('type = ?');
    values.push(updates.type);
  }
  if (updates.note !== undefined) {
    assignments.push('note = ?');
    values.push(updates.note);
  }
  if (updates.date !== undefined) {
    assignments.push('date = ?');
    values.push(updates.date);
  }
  if (assignments.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE transactions SET ${assignments.join(', ')}, updated_at = datetime('now'), synced = 0 WHERE id = ?;`,
    values,
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
}

export async function getTransactionsByMonth(month: MonthString): Promise<TransactionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TransactionRow>(`${WITH_CATEGORY} WHERE t.date LIKE ? ORDER BY t.date DESC, t.created_at DESC;`, [`${month}%`]);
}

export async function getRecentTransactions(limit: number): Promise<TransactionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TransactionRow>(`${WITH_CATEGORY} ORDER BY t.date DESC, t.created_at DESC LIMIT ?;`, [limit]);
}

export async function getTransactions(options?: {
  type?: TransactionType;
  query?: string;
  limit?: number;
}): Promise<TransactionRow[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: SQLiteBindValue[] = [];
  const query = options?.query?.trim();

  if (options?.type) {
    clauses.push('t.type = ?');
    params.push(options.type);
  }
  if (query) {
    const pattern = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    clauses.push(
      "(COALESCE(t.note, '') LIKE ? ESCAPE '\\' OR c.name_en LIKE ? ESCAPE '\\' OR c.name_bn LIKE ? ESCAPE '\\')",
    );
    params.push(pattern, pattern, pattern);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(options?.limit ?? 200);
  return db.getAllAsync<TransactionRow>(
    `${WITH_CATEGORY} ${where} ORDER BY t.date DESC, t.created_at DESC LIMIT ?;`,
    params,
  );
}

export async function getTotalBetween(
  start: DateString,
  end: DateString,
  type: TransactionType = 'expense',
): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE date >= ? AND date <= ? AND type = ?;`,
    [start, end, type],
  );
  return row?.total ?? 0;
}

export async function getCategoryTotalsBetween(
  start: DateString,
  end: DateString,
  type: TransactionType = 'expense',
): Promise<{ category_id: number; total: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync<{ category_id: number; total: number }>(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE date >= ? AND date <= ? AND type = ?
     GROUP BY category_id;`,
    [start, end, type],
  );
}

export async function getMonthlyTotal(month: MonthString, type: TransactionType = 'expense'): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE date LIKE ? AND type = ?;`,
    [`${month}%`, type]
  );
  return row?.total ?? 0;
}

export async function getCategoryTotals(month: MonthString, type: TransactionType = 'expense'): Promise<{ category_id: number; total: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync<{ category_id: number; total: number }>(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE date LIKE ? AND type = ? GROUP BY category_id;`,
    [`${month}%`, type]
  );
}

export async function getTodayTotal(today: DateString): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE date = ? AND type = 'expense';`,
    [today]
  );
  return row?.total ?? 0;
}

export async function searchTransactions(query: string, type?: TransactionType): Promise<TransactionRow[]> {
  const db = await getDatabase();
  const typeClause = type ? 'AND t.type = ?' : '';
  const params: string[] = [`%${query}%`];
  if (type) params.push(type);
  return db.getAllAsync<TransactionRow>(`${WITH_CATEGORY} WHERE t.note LIKE ? ${typeClause} ORDER BY t.date DESC LIMIT 100;`, params);
}
