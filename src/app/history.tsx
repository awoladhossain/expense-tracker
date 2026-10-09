import { useFocusEffect } from 'expo-router';
import { Calendar, Filter, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TransactionListItem } from '@/components/transaction-list-item';
import { AppInput } from '@/components/ui/app-input';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Tokens } from '@/constants/tokens';
import {
  deleteTransaction,
  getTransactions,
  type TransactionRow,
  type TransactionType,
} from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import {
  currentMonth,
  currentWeekRange,
  getMonthRange,
  relativeDate,
  todayISO,
  type DateString,
} from '@/utils/date';

type TypeFilter = 'all' | TransactionType;
type DatePeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

type HistoryItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'transaction'; id: string; transaction: TransactionRow };

export default function HistoryScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DatePeriod>('all');

  // Custom date range modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [appliedCustomStart, setAppliedCustomStart] = useState<DateString | null>(null);
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<DateString | null>(null);

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Compute startDate & endDate according to dateFilter
  const dateRange = useMemo((): { start?: DateString; end?: DateString } => {
    if (dateFilter === 'today') {
      const today = todayISO();
      return { start: today, end: today };
    }
    if (dateFilter === 'week') {
      return currentWeekRange();
    }
    if (dateFilter === 'month') {
      return getMonthRange(currentMonth());
    }
    if (dateFilter === 'custom' && appliedCustomStart && appliedCustomEnd) {
      return { start: appliedCustomStart, end: appliedCustomEnd };
    }
    return {};
  }, [dateFilter, appliedCustomStart, appliedCustomEnd]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getTransactions({
        type: typeFilter === 'all' ? undefined : typeFilter,
        query: debouncedQuery || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setTransactions(rows);
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load history', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, debouncedQuery, dateRange.start, dateRange.end]);

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

  const typeTabs: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: t.history.filterAll },
    { id: 'expense', label: t.history.filterExpense },
    { id: 'income', label: t.history.filterIncome },
  ];

  const dateChips: { id: DatePeriod; label: string }[] = [
    { id: 'all', label: t.history.filterAll },
    { id: 'today', label: t.history.filterToday },
    { id: 'week', label: t.history.filterThisWeek },
    { id: 'month', label: t.history.filterThisMonth },
    { id: 'custom', label: t.history.filterCustom },
  ];

  const handleDateSelect = (id: DatePeriod) => {
    if (id === 'custom') {
      setShowCustomModal(true);
    } else {
      setDateFilter(id);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setAppliedCustomStart(customStart <= customEnd ? customStart : customEnd);
      setAppliedCustomEnd(customStart <= customEnd ? customEnd : customStart);
      setDateFilter('custom');
      setShowCustomModal(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t.history.title} />
      <View style={styles.header}>
        {/* Universal Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Search color={colors.textMuted} size={20} />
          <TextInput
            onChangeText={setQuery}
            placeholder={t.history.searchPlaceholder}
            placeholderTextColor={colors.textDisabled}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
          />
        </View>

        {/* Type Segmented Control */}
        <View style={[styles.typeSegments, { backgroundColor: colors.surfaceAlt }]}>
          {typeTabs.map((item) => {
            const isSelected = typeFilter === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => setTypeFilter(item.id)}
                style={[
                  styles.typeSegment,
                  { backgroundColor: isSelected ? colors.surface : 'transparent' },
                ]}>
                <Text
                  style={[
                    styles.typeSegmentLabel,
                    { color: isSelected ? colors.text : colors.textMuted },
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Scrollable Date Filter Chips */}
        <ScrollView
          contentContainerStyle={styles.dateChipsScroll}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {dateChips.map((chip) => {
            const isSelected = dateFilter === chip.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={chip.id}
                onPress={() => handleDateSelect(chip.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                {isSelected && (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                )}
                {chip.id === 'custom' && (
                  <Calendar
                    color={isSelected ? colors.primary : colors.textMuted}
                    size={14}
                  />
                )}
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}>
                  {chip.id === 'custom' && appliedCustomStart && dateFilter === 'custom'
                    ? `${appliedCustomStart} → ${appliedCustomEnd}`
                    : chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List / Loader / EmptyState */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={failed ? [] : items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              description={t.history.noResultsDesc}
              icon={Filter}
              title={t.history.noResults}
            />
          }
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text style={[styles.dateHeader, { color: colors.textMuted }]}>
                {item.title}
              </Text>
            ) : (
              <TransactionListItem
                onDelete={() => confirmDelete(item.transaction)}
                transaction={item.transaction}
              />
            )
          }
        />
      )}

      {/* Custom Date Range Modal */}
      <Modal animationType="fade" transparent visible={showCustomModal}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t.history.filterCustom}
            </Text>

            <AppInput
              label={t.history.from}
              onChangeText={setCustomStart}
              placeholder="YYYY-MM-DD"
              value={customStart}
            />

            <AppInput
              label={t.history.to}
              onChangeText={setCustomEnd}
              placeholder="YYYY-MM-DD"
              value={customEnd}
            />

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowCustomModal(false)}
                style={[styles.modalCancel, { borderColor: colors.border }]}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  {t.common.cancel}
                </Text>
              </Pressable>
              <GradientButton
                onPress={handleApplyCustom}
                style={styles.modalApply}
                title={t.history.apply}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.sm,
    gap: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.sm,
  },
  title: {
    fontSize: Tokens.typography.hero.fontSize,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Tokens.radius.md,
    minHeight: 48,
    paddingHorizontal: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Tokens.typography.bodyLg.fontSize,
  },
  typeSegments: {
    flexDirection: 'row',
    borderRadius: Tokens.radius.md,
    padding: 4,
  },
  typeSegment: {
    flex: 1,
    minHeight: 36,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSegmentLabel: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '700',
  },
  dateChipsScroll: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: Tokens.radius.full,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingBottom: 40,
    gap: Tokens.spacing.sm,
  },
  dateHeader: {
    marginTop: Tokens.spacing.md,
    marginBottom: Tokens.spacing.xs,
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Tokens.spacing.lg,
  },
  modalCard: {
    padding: Tokens.spacing.xl,
    gap: Tokens.spacing.md,
  },
  modalTitle: {
    fontSize: Tokens.typography.title.fontSize,
    fontWeight: '700',
    marginBottom: Tokens.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
    marginTop: Tokens.spacing.sm,
  },
  modalCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
  modalApply: {
    flex: 1,
  },
});
