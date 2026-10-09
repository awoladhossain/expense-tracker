/**
 * Expense Tracker — Categories DB CRUD
 */

import { getDatabase } from './database';

export interface CategoryRow {
  id: number;
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  is_default: 0 | 1;
  budget_limit: number | null;
  created_at: string;
}

export type NewCategory = Omit<CategoryRow, 'id' | 'created_at'>;

export async function getAllCategories(): Promise<CategoryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY is_default DESC, name_en ASC;');
}

export async function getCategoryById(id: number): Promise<CategoryRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?;', [id]);
}

export async function insertCategory(cat: NewCategory): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO categories (name_en, name_bn, icon, color, is_default, budget_limit) VALUES (?, ?, ?, ?, ?, ?);`,
    [cat.name_en, cat.name_bn, cat.icon, cat.color, cat.is_default, cat.budget_limit]
  );
  return result.lastInsertRowId;
}

export async function updateCategoryBudget(id: number, budgetLimit: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE categories SET budget_limit = ? WHERE id = ?;', [budgetLimit, id]);
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0;', [id]);
  if (result.changes === 0) {
    throw new Error('Category could not be deleted');
  }
}
