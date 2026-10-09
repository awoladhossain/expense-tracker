/**
 * Expense Tracker — i18n Bengali
 */

import type { TranslationKeys } from './en';

const bn: TranslationKeys = {
  common: {
    appName: 'খরচ ট্র্যাকার', save: 'সংরক্ষণ করুন', cancel: 'বাতিল', delete: 'মুছুন',
    edit: 'সম্পাদনা', add: 'যোগ করুন', confirm: 'নিশ্চিত করুন', loading: 'লোড হচ্ছে...',
    error: 'কিছু একটা ভুল হয়েছে', retry: 'আবার চেষ্টা করুন', noData: 'এখনো কোনো ডেটা নেই', ok: 'ঠিক আছে',
  },
  tabs: { home: 'হোম', stats: 'পরিসংখ্যান', add: 'যোগ', history: 'ইতিহাস', settings: 'সেটিংস' },
  home: {
    title: 'ড্যাশবোর্ড', todaySpent: 'আজকের খরচ', thisMonth: 'এই মাসে',
    budgetUsed: 'বাজেট ব্যবহার', recentTransactions: 'সাম্প্রতিক লেনদেন', seeAll: 'সব দেখুন',
    noTransactions: 'এখনো কোনো খরচ নেই।\n+ বাটনে ট্যাপ করে প্রথম খরচ যোগ করুন!',
    categoryBreakdown: 'ক্যাটাগরি বিশ্লেষণ',
  },
  addExpense: {
    title: 'খরচ যোগ করুন', titleIncome: 'আয় যোগ করুন', amountPlaceholder: '০.০০',
    category: 'ক্যাটাগরি', note: 'নোট (ঐচ্ছিক)', notePlaceholder: 'যেমন: রেস্তোরাঁতে দুপুরের খাবার',
    date: 'তারিখ', type: 'ধরন', expense: 'খরচ', income: 'আয়',
    saveExpense: 'খরচ সংরক্ষণ করুন', saveIncome: 'আয় সংরক্ষণ করুন',
    errors: { amountRequired: 'পরিমাণ দেওয়া আবশ্যক', amountInvalid: '০-এর বেশি সঠিক পরিমাণ দিন', categoryRequired: 'একটি ক্যাটাগরি বেছে নিন' },
  },
  history: {
    title: 'ইতিহাস', searchPlaceholder: 'লেনদেন খুঁজুন...', filterAll: 'সব',
    filterExpense: 'খরচ', filterIncome: 'আয়', noResults: 'কোনো লেনদেন পাওয়া যায়নি',
    deleteConfirmTitle: 'লেনদেন মুছুন', deleteConfirmMessage: 'আপনি কি এই লেনদেনটি মুছতে চান?',
  },
  budget: {
    title: 'বাজেট', monthlyBudget: 'মাসিক বাজেট', setBudget: 'বাজেট নির্ধারণ করুন',
    editBudget: 'বাজেট সম্পাদনা করুন', budgetAmount: 'বাজেট পরিমাণ', spent: 'খরচ হয়েছে',
    remaining: 'বাকি আছে', overBudget: 'বাজেট ছাড়িয়ে গেছে!', noBudgetSet: 'এই মাসের জন্য কোনো বাজেট নির্ধারণ করা হয়নি',
    categoryBudgets: 'ক্যাটাগরি বাজেট',
  },
  stats: {
    title: 'পরিসংখ্যান', daily: 'দৈনিক', weekly: 'সাপ্তাহিক', monthly: 'মাসিক',
    totalExpense: 'মোট খরচ', totalIncome: 'মোট আয়', netSavings: 'নিট সঞ্চয়',
  },
  settings: {
    title: 'সেটিংস', language: 'ভাষা', currency: 'মুদ্রা', theme: 'থিম',
    themeLight: 'লাইট', themeDark: 'ডার্ক', themeSystem: 'সিস্টেম', reminder: 'দৈনিক রিমাইন্ডার',
    reminderTime: 'রিমাইন্ডারের সময়', privacyPolicy: 'গোপনীয়তা নীতি', version: 'ভার্সন',
  },
  level: { low: 'কম', moderate: 'মাঝারি', high: 'বেশি', label: 'খরচের স্তর' },
  categories: {
    food: 'খাবার', transport: 'যানবাহন', bills: 'বিল', shopping: 'কেনাকাটা',
    health: 'স্বাস্থ্য', entertainment: 'বিনোদন', others: 'অন্যান্য', addCustom: 'ক্যাটাগরি যোগ করুন',
  },
};

export default bn;
