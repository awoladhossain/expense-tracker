/**
 * Expense Tracker — i18n English
 */

const en = {
  common: {
    appName: 'Expense Tracker', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    edit: 'Edit', add: 'Add', confirm: 'Confirm', loading: 'Loading...',
    error: 'Something went wrong', retry: 'Retry', noData: 'No data yet', ok: 'OK',
  },
  tabs: { home: 'Home', stats: 'Stats', add: 'Add', history: 'History', settings: 'Settings' },
  home: {
    title: 'Dashboard', todaySpent: "Today's Expenses", thisMonth: 'This Month',
    budgetUsed: 'Budget Used', recentTransactions: 'Recent Transactions', seeAll: 'See All',
    noTransactions: 'No expenses yet.\nTap + to add your first expense!',
    categoryBreakdown: 'Category Breakdown',
  },
  addExpense: {
    title: 'Add Expense', titleIncome: 'Add Income', amountPlaceholder: '0.00',
    category: 'Category', note: 'Note (optional)', notePlaceholder: 'e.g. Lunch at restaurant',
    date: 'Date', type: 'Type', expense: 'Expense', income: 'Income',
    saveExpense: 'Save Expense', saveIncome: 'Save Income',
    errors: { amountRequired: 'Amount is required', amountInvalid: 'Enter a valid amount greater than 0', categoryRequired: 'Please select a category' },
  },
  history: {
    title: 'History', searchPlaceholder: 'Search transactions...', filterAll: 'All',
    filterExpense: 'Expenses', filterIncome: 'Income', noResults: 'No transactions found',
    deleteConfirmTitle: 'Delete Transaction', deleteConfirmMessage: 'Are you sure you want to delete this transaction?',
  },
  budget: {
    title: 'Budget', monthlyBudget: 'Monthly Budget', setBudget: 'Set Budget',
    editBudget: 'Edit Budget', budgetAmount: 'Budget Amount', spent: 'Spent',
    remaining: 'Remaining', overBudget: 'Over Budget!', noBudgetSet: 'No budget set for this month',
    categoryBudgets: 'Category Budgets',
  },
  stats: {
    title: 'Statistics', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    totalExpense: 'Total Expense', totalIncome: 'Total Income', netSavings: 'Net Savings',
  },
  settings: {
    title: 'Settings', language: 'Language', currency: 'Currency', theme: 'Theme',
    themeLight: 'Light', themeDark: 'Dark', themeSystem: 'System', reminder: 'Daily Reminder',
    reminderTime: 'Reminder Time', privacyPolicy: 'Privacy Policy', version: 'Version',
  },
  level: { low: 'Low', moderate: 'Moderate', high: 'High', label: 'Spending Level' },
  categories: {
    food: 'Food', transport: 'Transport', bills: 'Bills', shopping: 'Shopping',
    health: 'Health', entertainment: 'Entertainment', others: 'Others', addCustom: 'Add Category',
  },
} as const;

export default en;

type DeepString<T> = { [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string; };
export type TranslationKeys = DeepString<typeof en>;
