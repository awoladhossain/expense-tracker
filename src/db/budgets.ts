/**
 * Expense Tracker — Budgets DB CRUD
 */

import { getDatabase } from './database';
import type { MonthString } from '@/utils/date';

export interface BudgetRow {
  id: number;
  month: MonthString;
  total_limit: number;
  created_at: string;
}

export async function getBudgetByMonth(month: MonthString): Promise<BudgetRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<BudgetRow>('SELECT * FROM budgets WHERE month = ?;', [month]);
}

export async function upsertBudget(month: MonthString, totalLimit: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO budgets (month, total_limit) VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET total_limit = excluded.total_limit;`,
    [month, totalLimit]
  );
}

export async function deleteBudget(month: MonthString): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE month = ?;', [month]);
}

export async function getRecentBudgets(limit = 6): Promise<BudgetRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<BudgetRow>('SELECT * FROM budgets ORDER BY month DESC LIMIT ?;', [limit]);
}
