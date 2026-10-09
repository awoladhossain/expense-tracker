import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { TransactionListItem } from '@/components/transaction-list-item';
import { getBudgetByMonth } from '@/db/budgets';
import { getAllCategories } from '@/db/categories';
import {
  getCategoryTotals,
  getMonthlyTotal,
  getRecentTransactions,
  getTodayTotal,
  type TransactionRow,
} from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { DASHBOARD_RECENT_LIMIT, BUDGET_DANGER_THRESHOLD, BUDGET_WARNING_THRESHOLD } from '@/constants/config';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';
import { currentMonth, formatMonth, todayISO, toBengaliNumerals } from '@/utils/date';
import { getCategoryBudget, getLevel, getSpendingRatio } from '@/utils/level';

type CategorySpend = {
  id: number;
  nameEn: string;
  nameBn: string;
  icon: string;
  color: string;
  total: number;
  budget: number;
};

export default function HomeScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategorySpend[]>([]);
  const [recent, setRecent] = useState<TransactionRow[]>([]);

  const load = useCallback(async () => {
    try {
      const month = currentMonth();
      const [today, spent, budget, allCategories, totals, latest] = await Promise.all([
        getTodayTotal(todayISO()),
        getMonthlyTotal(month, 'expense'),
        getBudgetByMonth(month),
        getAllCategories(),
        getCategoryTotals(month, 'expense'),
        getRecentTransactions(DASHBOARD_RECENT_LIMIT),
      ]);
      const totalByCategory = new Map(totals.map((row) => [row.category_id, row.total]));
      const limit = budget?.total_limit ?? null;
      setTodayTotal(today);
      setMonthExpense(spent);
      setBudgetLimit(limit);
      setCategories(
        allCategories
          .map((category) => ({
            id: category.id,
            nameEn: category.name_en,
            nameBn: category.name_bn,
            icon: category.icon,
            color: category.color,
            total: totalByCategory.get(category.id) ?? 0,
            budget: getCategoryBudget(category.budget_limit, limit ?? 0, allCategories.length),
          }))
          .filter((category) => category.total > 0)
          .sort((a, b) => b.total - a.total),
      );
      setRecent(latest);
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load dashboard', error);
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const budgetRatio = budgetLimit && budgetLimit > 0 ? monthExpense / budgetLimit : 0;
  const budgetColor =
    budgetRatio >= BUDGET_DANGER_THRESHOLD
      ? colors.budgetDanger
      : budgetRatio >= BUDGET_WARNING_THRESHOLD
        ? colors.budgetWarning
        : colors.budgetSafe;
  const budgetPercent = Math.round(budgetRatio * 100);
  const budgetPercentLabel = language === 'bn' ? `${toBengaliNumerals(budgetPercent)}%` : `${budgetPercent}%`;
  const largestCategory = Math.max(...categories.map((category) => category.total), 1);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.home.title}</Text>
          <Text style={[styles.month, { color: colors.textMuted }]}>{formatMonth(currentMonth(), language)}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : failed ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.common.error}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryLabel}>{t.common.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroLabel}>{t.home.todaySpent}</Text>
              <Text style={styles.heroAmount}>{formatMoney(todayTotal, currency, language)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t.home.thisMonth}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(monthExpense, currency, language)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/budget')}
                style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t.home.budgetUsed}</Text>
                {budgetLimit ? (
                  <>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{budgetPercentLabel}</Text>
                    <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.fill, { backgroundColor: budgetColor, width: `${Math.min(budgetRatio, 1) * 100}%` }]} />
                    </View>
                  </>
                ) : (
                  <Text style={[styles.link, { color: colors.primary }]}>{t.budget.setBudget}</Text>
                )}
              </Pressable>
            </View>

            <Text style={[styles.section, { color: colors.text }]}>{t.home.categoryBreakdown}</Text>
            {categories.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.common.noData}</Text>
            ) : (
              categories.map((category) => {
                const level = category.budget > 0 ? getLevel(category.total, category.budget) : null;
                const levelColor =
                  level === 'high' ? colors.levelHigh : level === 'moderate' ? colors.levelModerate : colors.levelLow;
                return (
                  <View key={category.id} style={styles.categoryRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}22` }]}>
                      <CategoryIcon name={category.icon} color={category.color} size={18} />
                    </View>
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryTitleRow}>
                        <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                          {language === 'bn' ? category.nameBn : category.nameEn}
                        </Text>
                        <Text numberOfLines={2} style={[styles.categoryAmount, { color: level ? levelColor : colors.text }]}>
                          {formatMoney(category.total, currency, language)}
                          {level ? ` · ${t.level[level]}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                        <View
                          style={[
                            styles.fill,
                            {
                              backgroundColor: level ? levelColor : category.color,
                              width: `${getSpendingRatio(category.total, largestCategory) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: colors.text }]}>{t.home.recentTransactions}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/history')}>
                <Text style={[styles.link, { color: colors.primary }]}>{t.home.seeAll}</Text>
              </Pressable>
            </View>
            {recent.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.home.noTransactions}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/add')}
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.primaryLabel}>{t.addExpense.title}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.list}>
                {recent.map((transaction) => (
                  <TransactionListItem key={transaction.id} transaction={transaction} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700' },
  month: { fontSize: 15, fontWeight: '600' },
  loader: { marginTop: 48 },
  hero: { borderRadius: 20, padding: 20, gap: 8 },
  heroLabel: { color: '#E0E7FF', fontSize: 14, fontWeight: '600' },
  heroAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, minHeight: 96 },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  track: { height: 6, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  section: { fontSize: 18, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontSize: 14, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { flex: 1, gap: 6 },
  categoryTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  categoryName: { flex: 1, fontSize: 15, fontWeight: '600' },
  categoryAmount: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  list: { gap: 10 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  primaryButton: { minHeight: 44, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
