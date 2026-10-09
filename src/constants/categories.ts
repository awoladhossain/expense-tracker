/**
 * Expense Tracker — Default Categories
 * Categorized by Transaction Type (Expense vs. Income)
 */

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: number;
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: 1 | 0;
  budget_limit: number | null;
  is_deleted: 1 | 0;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Default Expense Categories
  { name_en: 'Food', name_bn: 'খাবার', icon: 'UtensilsCrossed', color: '#F97316', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Transport', name_bn: 'যানবাহন', icon: 'Bus', color: '#3B82F6', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Bills', name_bn: 'বিল', icon: 'Receipt', color: '#8B5CF6', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Shopping', name_bn: 'কেনাকাটা', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Health', name_bn: 'স্বাস্থ্য', icon: 'HeartPulse', color: '#EF4444', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Entertainment', name_bn: 'বিনোদন', icon: 'Clapperboard', color: '#F59E0B', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Others', name_bn: 'অন্যান্য', icon: 'Ellipsis', color: '#64748B', type: 'expense', is_default: 1, budget_limit: null, is_deleted: 0 },

  // Default Income Categories
  { name_en: 'Salary', name_bn: 'বেতন', icon: 'Briefcase', color: '#10B981', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Freelance', name_bn: 'ফ্রিল্যান্সিং', icon: 'Laptop', color: '#06B6D4', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Business', name_bn: 'ব্যবসা', icon: 'Building2', color: '#8B5CF6', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Investments', name_bn: 'বিনিয়োগ', icon: 'TrendingUp', color: '#F59E0B', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Gifts', name_bn: 'উপহার', icon: 'Gift', color: '#EC4899', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
  { name_en: 'Other Income', name_bn: 'অন্যান্য আয়', icon: 'Wallet', color: '#64748B', type: 'income', is_default: 1, budget_limit: null, is_deleted: 0 },
];

export const CATEGORY_COUNT = DEFAULT_CATEGORIES.length;
