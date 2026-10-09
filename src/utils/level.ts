/**
 * Expense Tracker — Level Calculation Utility
 */

import { LEVEL_HIGH_THRESHOLD, LEVEL_MODERATE_THRESHOLD } from '@/constants/config';
import { Colors } from '@/constants/colors';

export type Level = 'low' | 'moderate' | 'high';

export function getLevel(spent: number, budget: number): Level {
  if (budget <= 0) return 'low';
  const ratio = spent / budget;
  if (ratio >= LEVEL_HIGH_THRESHOLD) return 'high';
  if (ratio >= LEVEL_MODERATE_THRESHOLD) return 'moderate';
  return 'low';
}

export function getLevelColor(level: Level, isDark = false): string {
  const palette = isDark ? Colors.dark : Colors.light;
  return { low: palette.levelLow, moderate: palette.levelModerate, high: palette.levelHigh }[level];
}

export function getLevelEmoji(level: Level): string {
  return { low: '🟢', moderate: '🟡', high: '🔴' }[level];
}

export function getCategoryBudget(
  categoryBudgetLimit: number | null,
  totalMonthlyBudget: number,
  totalCategories: number,
): number {
  if (categoryBudgetLimit != null && categoryBudgetLimit > 0) return categoryBudgetLimit;
  if (totalCategories <= 0 || totalMonthlyBudget <= 0) return 0;
  return totalMonthlyBudget / totalCategories;
}

export function getSpendingRatio(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(spent / budget, 1);
}
