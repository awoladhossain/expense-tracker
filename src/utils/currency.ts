/**
 * Expense Tracker — Currency Formatting Utility
 */

import { DEFAULT_CURRENCY_SYMBOL } from '@/constants/config';
import { toBengaliNumerals } from '@/utils/date';

export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'INR';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BDT: '৳', USD: '$', EUR: '€', INR: '₹',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'BDT'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? DEFAULT_CURRENCY_SYMBOL;
  const formatted = Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${formatted}`;
}

export function formatCompact(amount: number, currency: CurrencyCode = 'BDT'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? DEFAULT_CURRENCY_SYMBOL;
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${symbol}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${symbol}${(abs / 1_000).toFixed(1)}K`;
  return `${symbol}${abs.toFixed(0)}`;
}

export function getCurrencySymbol(currency: CurrencyCode = 'BDT'): string {
  return CURRENCY_SYMBOLS[currency] ?? DEFAULT_CURRENCY_SYMBOL;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'BDT',
  language: 'en' | 'bn' = 'en',
): string {
  const formatted = formatCurrency(Math.abs(amount), currency);
  const withSign = amount < 0 ? `−${formatted}` : formatted;
  return language === 'bn' ? toBengaliNumerals(withSign) : withSign;
}

export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if ((cleaned.match(/\./g) ?? []).length > 1) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  return num;
}
