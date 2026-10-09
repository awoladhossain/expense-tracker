/**
 * Expense Tracker — Default Categories
 */

export interface Category {
  id: number;
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  is_default: 1 | 0;
  budget_limit: number | null;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name_en: 'Food', name_bn: 'খাবার', icon: 'UtensilsCrossed', color: '#F97316', is_default: 1, budget_limit: null },
  { name_en: 'Transport', name_bn: 'যানবাহন', icon: 'Bus', color: '#3B82F6', is_default: 1, budget_limit: null },
  { name_en: 'Bills', name_bn: 'বিল', icon: 'Receipt', color: '#8B5CF6', is_default: 1, budget_limit: null },
  { name_en: 'Shopping', name_bn: 'কেনাকাটা', icon: 'ShoppingBag', color: '#EC4899', is_default: 1, budget_limit: null },
  { name_en: 'Health', name_bn: 'স্বাস্থ্য', icon: 'HeartPulse', color: '#EF4444', is_default: 1, budget_limit: null },
  { name_en: 'Entertainment', name_bn: 'বিনোদন', icon: 'Clapperboard', color: '#F59E0B', is_default: 1, budget_limit: null },
  { name_en: 'Others', name_bn: 'অন্যান্য', icon: 'Ellipsis', color: '#64748B', is_default: 1, budget_limit: null },
];

export const CATEGORY_COUNT = DEFAULT_CATEGORIES.length;
