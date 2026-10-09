/**
 * Expense Tracker — Categories DB CRUD
 */

import type { CategoryType } from '@/constants/categories';
import { getDatabase } from './database';

export interface CategoryRow {
  id: number;
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: 0 | 1;
  budget_limit: number | null;
  is_deleted: 0 | 1;
  created_at: string;
}

export type NewCategory = Omit<CategoryRow, 'id' | 'created_at'>;

export type CustomCategoryInput = {
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  type: CategoryType;
  budget_limit?: number | null;
};

export async function getAllCategories(): Promise<CategoryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE is_deleted = 0 ORDER BY is_default DESC, name_en ASC;'
  );
}

export async function getCategoriesByType(type: CategoryType): Promise<CategoryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE type = ? AND is_deleted = 0 ORDER BY is_default DESC, name_en ASC;',
    [type]
  );
}

export async function getCategoryById(id: number): Promise<CategoryRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ? AND is_deleted = 0;',
    [id]
  );
}

export async function insertCategory(cat: NewCategory): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO categories (name_en, name_bn, icon, color, type, is_default, budget_limit, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      cat.name_en,
      cat.name_bn,
      cat.icon,
      cat.color,
      cat.type,
      cat.is_default,
      cat.budget_limit,
      cat.is_deleted ?? 0,
    ]
  );
  return result.lastInsertRowId;
}

export async function insertCustomCategory(cat: CustomCategoryInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO categories (name_en, name_bn, icon, color, type, is_default, budget_limit, is_deleted)
     VALUES (?, ?, ?, ?, ?, 0, ?, 0);`,
    [
      cat.name_en,
      cat.name_bn,
      cat.icon,
      cat.color,
      cat.type,
      cat.budget_limit ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  id: number,
  updates: Partial<Pick<CategoryRow, 'name_en' | 'name_bn' | 'icon' | 'color' | 'budget_limit' | 'type'>>
): Promise<void> {
  const db = await getDatabase();
  const assignments: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name_en !== undefined) {
    assignments.push('name_en = ?');
    values.push(updates.name_en);
  }
  if (updates.name_bn !== undefined) {
    assignments.push('name_bn = ?');
    values.push(updates.name_bn);
  }
  if (updates.icon !== undefined) {
    assignments.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    assignments.push('color = ?');
    values.push(updates.color);
  }
  if (updates.budget_limit !== undefined) {
    assignments.push('budget_limit = ?');
    values.push(updates.budget_limit);
  }
  if (updates.type !== undefined) {
    assignments.push('type = ?');
    values.push(updates.type);
  }

  if (assignments.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE categories SET ${assignments.join(', ')} WHERE id = ? AND is_deleted = 0;`,
    values
  );
}

export async function updateCategoryBudget(id: number, budgetLimit: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE categories SET budget_limit = ? WHERE id = ? AND is_deleted = 0;',
    [budgetLimit, id]
  );
}

export async function softDeleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE categories SET is_deleted = 1 WHERE id = ? AND is_default = 0;',
    [id]
  );
  if (result.changes === 0) {
    throw new Error('Category could not be deleted or is a default category');
  }
}

export async function deleteCategory(id: number): Promise<void> {
  // Alias to soft delete to avoid orphan transaction issues
  await softDeleteCategory(id);
}
