/**
 * Expense Tracker — Data Export Utilities (CSV / JSON)
 * Using File and Paths from expo-file-system and expo-sharing
 * UTF-8 BOM (\uFEFF) included for Excel Bengali compatibility
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getDatabase } from '@/db/database';
import { type TransactionRow } from '@/db/transactions';

interface ExportMetadata {
  app_name: string;
  export_date: string;
  total_transactions: number;
}

interface ExportJSONPayload {
  metadata: ExportMetadata;
  transactions: TransactionRow[];
}

export async function fetchAllTransactionsWithCategory(): Promise<TransactionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<TransactionRow>(`
    SELECT t.*, c.name_en AS category_name_en, c.name_bn AS category_name_bn,
           c.icon AS category_icon, c.color AS category_color
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    ORDER BY t.date DESC, t.created_at DESC;
  `);
}

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function exportTransactionsCSV(): Promise<boolean> {
  const transactions = await fetchAllTransactionsWithCategory();

  // CSV Headers
  const headers = [
    'ID',
    'Date',
    'Type',
    'Amount',
    'Category (EN)',
    'Category (BN)',
    'Note',
    'Created At',
  ];

  const rows = transactions.map((t) => [
    escapeCsvField(t.id),
    escapeCsvField(t.date),
    escapeCsvField(t.type),
    escapeCsvField(t.amount),
    escapeCsvField(t.category_name_en ?? ''),
    escapeCsvField(t.category_name_bn ?? ''),
    escapeCsvField(t.note ?? ''),
    escapeCsvField(t.created_at),
  ]);

  // Prepend UTF-8 BOM so Excel opens Bengali characters without mojibake
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `expense-tracker-${todayStr}.csv`;
  const file = new File(Paths.cache, filename);

  file.create();
  file.write(csvContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Transactions CSV',
      UTI: 'public.comma-separated-values-text',
    });
    return true;
  }
  return false;
}

export async function exportTransactionsJSON(): Promise<boolean> {
  const transactions = await fetchAllTransactionsWithCategory();

  const payload: ExportJSONPayload = {
    metadata: {
      app_name: 'Expense Tracker',
      export_date: new Date().toISOString(),
      total_transactions: transactions.length,
    },
    transactions,
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `expense-tracker-${todayStr}.json`;
  const file = new File(Paths.cache, filename);

  file.create();
  file.write(jsonContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Transactions JSON',
      UTI: 'public.json',
    });
    return true;
  }
  return false;
}

export async function resetAllAppData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // Delete all transactions and budgets
    await db.execAsync(`DELETE FROM transactions;`);
    await db.execAsync(`DELETE FROM budgets;`);
    // Delete user custom categories (keep default categories intact)
    await db.execAsync(`DELETE FROM categories WHERE is_default = 0;`);
    // Reset any soft-deleted defaults
    await db.execAsync(`UPDATE categories SET is_deleted = 0 WHERE is_default = 1;`);
  });
}
