import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { TransactionListItem } from '@/components/transaction-list-item';
import { deleteTransaction, getTransactions, type TransactionRow, type TransactionType } from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { relativeDate } from '@/utils/date';

type Filter = 'all' | TransactionType;

type HistoryItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'transaction'; id: string; transaction: TransactionRow };

export default function HistoryScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    try {
      const rows = await getTransactions({
        type: filter === 'all' ? undefined : filter,
        query: debouncedQuery || undefined,
      });
      setTransactions(rows);
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load history', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const items = useMemo(() => {
    const next: HistoryItem[] = [];
    let lastDate = '';
    for (const transaction of transactions) {
      if (transaction.date !== lastDate) {
        next.push({
          kind: 'header',
          id: `date-${transaction.date}`,
          title: relativeDate(transaction.date, language),
        });
        lastDate = transaction.date;
      }
      next.push({ kind: 'transaction', id: `tx-${transaction.id}`, transaction });
    }
    return next;
  }, [language, transactions]);

  function confirmDelete(transaction: TransactionRow) {
    Alert.alert(t.history.deleteConfirmTitle, t.history.deleteConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => {
          deleteTransaction(transaction.id)
            .then(load)
            .catch((error) => {
              console.warn('Failed to delete transaction', error);
              Alert.alert(t.common.error);
            });
        },
      },
    ]);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.history.filterAll },
    { id: 'expense', label: t.history.filterExpense },
    { id: 'income', label: t.history.filterIncome },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t.history.title}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.history.searchPlaceholder}
          placeholderTextColor={colors.textDisabled}
          style={[styles.search, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />
        <View style={styles.filters}>
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setFilter(item.id)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}>
                <Text style={[styles.filterLabel, { color: selected ? '#FFFFFF' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={failed ? [] : items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {failed ? t.common.error : t.history.noResults}
            </Text>
          }
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text style={[styles.date, { color: colors.textMuted }]}>{item.title}</Text>
            ) : (
              <TransactionListItem transaction={item.transaction} onDelete={() => confirmDelete(item.transaction)} />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  search: { borderWidth: 1, borderRadius: 14, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  filters: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  filter: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterLabel: { fontSize: 14, fontWeight: '700' },
  loader: { marginTop: 32 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  date: { marginTop: 8, fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 15 },
});
