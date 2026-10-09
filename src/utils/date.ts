/**
 * Expense Tracker — Date Utility
 */

export type DateString = string;
export type MonthString = string;

const BENGALI_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const ENGLISH_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function toISODate(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): DateString {
  return toISODate(new Date());
}

export function currentMonth(): MonthString {
  return todayISO().substring(0, 7);
}

export function addDays(dateStr: DateString, days: number): DateString {
  const date = fromISODate(dateStr);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function currentWeekRange(): { start: DateString; end: DateString } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end) };
}

export function fromISODate(dateStr: DateString): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr: DateString, lang: 'en' | 'bn' = 'en'): string {
  const date = fromISODate(dateStr);
  const day = date.getDate();
  const month = lang === 'bn' ? BENGALI_MONTHS[date.getMonth()] : ENGLISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  if (lang === 'bn') return `${toBengaliNumerals(day)} ${month} ${toBengaliNumerals(year)}`;
  return `${day} ${month.slice(0, 3)} ${year}`;
}

export function formatMonth(monthStr: MonthString, lang: 'en' | 'bn' = 'en'): string {
  const [year, month] = monthStr.split('-').map(Number);
  const monthName = lang === 'bn' ? BENGALI_MONTHS[month - 1] : ENGLISH_MONTHS[month - 1];
  return lang === 'bn' ? `${monthName} ${toBengaliNumerals(year)}` : `${monthName} ${year}`;
}

export function relativeDate(dateStr: DateString, lang: 'en' | 'bn' = 'en'): string {
  const today = todayISO();
  if (dateStr === today) return lang === 'bn' ? 'আজ' : 'Today';
  if (dateStr === addDays(today, -1)) return lang === 'bn' ? 'গতকাল' : 'Yesterday';
  return formatDate(dateStr, lang);
}

export function getMonthRange(monthStr: MonthString): { start: DateString; end: DateString } {
  const [year, month] = monthStr.split('-').map(Number);
  const start = `${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function toBengaliNumerals(value: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/\d/g, (digit) => bengaliDigits[Number(digit)] ?? digit);
}

export { BENGALI_MONTHS, ENGLISH_MONTHS };
