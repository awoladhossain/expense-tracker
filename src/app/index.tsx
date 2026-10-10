import { router, useFocusEffect } from 'expo-router';
import {
  Plus,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TransactionListItem } from '@/components/transaction-list-item';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { useThemeColor } from '@/constants/colors';
import {
  BUDGET_DANGER_THRESHOLD,
  BUDGET_WARNING_THRESHOLD,
  DASHBOARD_RECENT_LIMIT,
} from '@/constants/config';
import { Tokens } from '@/constants/tokens';
import { getBudgetByMonth } from '@/db/budgets';
import { getCategoriesByType } from '@/db/categories';
import {
  getCategoryTotals,
  getMonthlyTotal,
  getRecentTransactions,
  type TransactionRow,
} from '@/db/transactions';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';
import { currentMonth, formatDate, todayISO, toBengaliNumerals } from '@/utils/date';
import { getCategoryBudget, getLevel, type Level } from '@/utils/level';

type CategoryLevelSpend = {
  id: number;
  nameEn: string;
  nameBn: string;
  icon: string;
  color: string;
  total: number;
  budget: number;
  ratio: number;
  level: Level;
};

export default function HomeScreen() {
  const colors = useThemeColor();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null);
  const [expenseLevels, setExpenseLevels] = useState<CategoryLevelSpend[]>([]);
  const [recent, setRecent] = useState<TransactionRow[]>([]);

  // Pulse animation for budget danger state
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 900 }),
      -1,
      true
    );
  }, [pulseAnim]);

  const animatedDangerPulse = useAnimatedStyle(() => {
    return {
      opacity: interpolate(pulseAnim.value, [0, 1], [0.65, 1]),
    };
  });

  const load = useCallback(async () => {
    try {
      const month = currentMonth();
      const [incomeTotal, spentTotal, budget, expenseCategories, expenseTotals, latest] =
        await Promise.all([
          getMonthlyTotal(month, 'income'),
          getMonthlyTotal(month, 'expense'),
          getBudgetByMonth(month),
          getCategoriesByType('expense'), // Strictly EXPENSE categories only
          getCategoryTotals(month, 'expense'),
          getRecentTransactions(DASHBOARD_RECENT_LIMIT),
        ]);

      const totalByCategory = new Map(expenseTotals.map((row) => [row.category_id, row.total]));
      const limit = budget?.total_limit ?? null;

      setMonthIncome(incomeTotal);
      setMonthExpense(spentTotal);
      setBudgetLimit(limit);

      // Process only expense categories for Level Tracking
      const computedLevels: CategoryLevelSpend[] = expenseCategories
        .map((category) => {
          const total = totalByCategory.get(category.id) ?? 0;
          const catBudget = getCategoryBudget(
            category.budget_limit,
            limit ?? 0,
            expenseCategories.length
          );
          const level = getLevel(total, catBudget);
          const ratio = catBudget > 0 ? total / catBudget : 0;

          return {
            id: category.id,
            nameEn: category.name_en,
            nameBn: category.name_bn,
            icon: category.icon,
            color: category.color,
            total,
            budget: catBudget,
            ratio,
            level,
          };
        })
        .filter((cat) => cat.total > 0)
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 5); // Max 5 sorted by ratio descending

      setExpenseLevels(computedLevels);
      setRecent(latest);
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load dashboard data', error);
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const netBalance = monthIncome - monthExpense;
  const isSurplus = netBalance >= 0;

  const budgetRatio = budgetLimit && budgetLimit > 0 ? monthExpense / budgetLimit : 0;
  const isBudgetDanger = budgetRatio >= BUDGET_DANGER_THRESHOLD;
  const isBudgetWarning = budgetRatio >= BUDGET_WARNING_THRESHOLD && !isBudgetDanger;

  const budgetColor = isBudgetDanger
    ? colors.danger
    : isBudgetWarning
      ? colors.warning
      : colors.success;

  const budgetPercent = Math.round(budgetRatio * 100);
  const budgetPercentLabel =
    language === 'bn' ? `${toBengaliNumerals(budgetPercent)}%` : `${budgetPercent}%`;

  const getLevelBadgeVariant = (level: Level): 'success' | 'warning' | 'danger' => {
    switch (level) {
      case 'high':
        return 'danger';
      case 'moderate':
        return 'warning';
      case 'low':
      default:
        return 'success';
    }
  };

  return (
    <Screen>
      <ScreenHeader
        rightAction={
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.push('/settings')}
            style={[
              styles.settingsBtn,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.glassBorder,
              },
            ]}>
            <Settings color={colors.accent} size={20} />
          </Pressable>
        }
        subtitle={formatDate(todayISO(), language)}
        title={t.home.title}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }>
        {/* Loading Skeletons */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonLoader height={140} radius={Tokens.radius.card} />
            <View style={styles.splitRow}>
              <SkeletonLoader height={94} radius={Tokens.radius.lg} width="48%" />
              <SkeletonLoader height={94} radius={Tokens.radius.lg} width="48%" />
            </View>
            <SkeletonLoader height={100} radius={Tokens.radius.lg} />
            <SkeletonLoader height={160} radius={Tokens.radius.card} />
            <SkeletonLoader height={64} radius={Tokens.radius.lg} />
          </View>
        ) : failed ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{t.common.error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryText}>{t.common.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Header: Net Balance Hero Card */}
            <GlassCard style={styles.heroCard}>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                {language === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
              </Text>

              <View style={styles.balanceRow}>
                <Text style={[styles.heroAmount, { color: colors.text }]}>
                  {formatMoney(netBalance, currency, language)}
                </Text>
                <Badge
                  label={
                    isSurplus
                      ? language === 'bn'
                        ? 'উদ্বৃত্ত'
                        : 'Surplus'
                      : language === 'bn'
                        ? 'ঘাটতি'
                        : 'Deficit'
                  }
                  variant={isSurplus ? 'success' : 'danger'}
                />
              </View>
            </GlassCard>

            {/* Split Cards: Monthly Income & Expense */}
            <View style={styles.splitRow}>
              <GlassCard style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: `${colors.success}18` }]}>
                    <TrendingUp color={colors.success} size={18} />
                  </View>
                  <Text style={[styles.splitLabel, { color: colors.textMuted }]}>
                    {language === 'bn' ? 'আয়' : 'Income'}
                  </Text>
                </View>
                <Text style={[styles.splitAmount, { color: colors.success }]}>
                  {formatMoney(monthIncome, currency, language)}
                </Text>
              </GlassCard>

              <GlassCard style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: `${colors.danger}18` }]}>
                    <TrendingDown color={colors.danger} size={18} />
                  </View>
                  <Text style={[styles.splitLabel, { color: colors.textMuted }]}>
                    {language === 'bn' ? 'খরচ' : 'Expense'}
                  </Text>
                </View>
                <Text style={[styles.splitAmount, { color: colors.text }]}>
                  {formatMoney(monthExpense, currency, language)}
                </Text>
              </GlassCard>
            </View>

            {/* Budget Progress Card */}
            <GlassCard style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.text }]}>
                  {language === 'bn' ? 'মাসিক বাজেট' : 'Monthly Budget'}
                </Text>
                {budgetLimit ? (
                  <Text style={[styles.budgetRatioText, { color: budgetColor }]}>
                    {budgetPercentLabel}
                  </Text>
                ) : (
                  <Badge
                    label={t.budget.setBudget}
                    onPress={() => router.push('/budget')}
                    variant="pill"
                  />
                )}
              </View>

              {budgetLimit ? (
                <>
                  <Text style={[styles.budgetSubtext, { color: colors.textMuted }]}>
                    {`${formatMoney(monthExpense, currency, language)} / ${formatMoney(
                      budgetLimit,
                      currency,
                      language
                    )} (${budgetPercentLabel})`}
                  </Text>
                  <View style={[styles.progressBarBase, { backgroundColor: colors.surfaceAlt }]}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: budgetColor,
                          width: `${Math.min(budgetRatio, 1) * 100}%`,
                        },
                        isBudgetDanger ? animatedDangerPulse : null,
                      ]}
                    />
                  </View>
                </>
              ) : (
                <Text style={[styles.noBudgetLabel, { color: colors.textMuted }]}>
                  {t.budget.noBudgetSet}
                </Text>
              )}
            </GlassCard>

            {/* Level Tracking Widget (CORE USP — Only Expense Categories) */}
            <GlassCard style={styles.levelsCard}>
              <View style={styles.levelsHeader}>
                <View style={styles.levelsTitleWrap}>
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'bn' ? 'ক্যাটাগরি লেভেল' : 'Category Levels'}
                  </Text>
                  <Text style={[styles.levelsSubtitle, { color: colors.textMuted }]}>
                    {language === 'bn'
                      ? 'খরচের স্তর ও বাজেট অনুপাত'
                      : 'Spending tier & budget thresholds'}
                  </Text>
                </View>
                <Badge
                  label={t.home.seeAll}
                  onPress={() => router.push('/stats')}
                  variant="pill"
                />
              </View>

              {expenseLevels.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  {t.common.noData}
                </Text>
              ) : (
                <View style={styles.levelsList}>
                  {expenseLevels.map((cat) => {
                    const badgeVariant = getLevelBadgeVariant(cat.level);
                    const levelColor =
                      cat.level === 'high'
                        ? colors.danger
                        : cat.level === 'moderate'
                          ? colors.warning
                          : colors.success;

                    return (
                      <Pressable
                        key={cat.id}
                        accessibilityRole="button"
                        onPress={() => router.push('/stats')}
                        style={styles.levelRow}>
                        <View style={[styles.levelIcon, { backgroundColor: `${cat.color}20` }]}>
                          <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                        </View>

                        <View style={styles.levelContent}>
                          <View style={styles.levelTitleRow}>
                            <Text
                              style={[styles.levelCategoryName, { color: colors.text }]}
                              numberOfLines={1}>
                              {language === 'bn' ? cat.nameBn : cat.nameEn}
                            </Text>
                            <View style={styles.levelMeta}>
                              <Text style={[styles.levelAmount, { color: colors.text }]}>
                                {formatMoney(cat.total, currency, language)}
                              </Text>
                              <Badge label={t.level[cat.level]} variant={badgeVariant} />
                            </View>
                          </View>

                          <View
                            style={[
                              styles.levelProgressBase,
                              { backgroundColor: colors.surfaceAlt },
                            ]}
                          >
                            <View
                              style={[
                                styles.levelProgressFill,
                                {
                                  backgroundColor: levelColor,
                                  width: `${Math.min(cat.ratio, 1) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </GlassCard>

            <View style={styles.recentHeader}>
              <Text numberOfLines={1} style={[styles.recentTitle, { color: colors.text }]}>
                {t.home.recentTransactions}
              </Text>
              <View style={styles.recentActions}>
                {recent.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/history')}
                    style={styles.seeAllButton}>
                    <Text style={[styles.seeAllLabel, { color: colors.primary }]}>{t.home.seeAll}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/add')}
                  style={[styles.recentAdd, { backgroundColor: colors.primary }]}>
                  <Plus color="#FFFFFF" size={16} />
                  <Text style={styles.recentAddLabel}>{t.common.add}</Text>
                </Pressable>
              </View>
            </View>

            {recent.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={language === 'bn' ? 'কোনো লেনদেন নেই' : 'No transactions yet'}
                description={
                  language === 'bn'
                    ? 'উপরে ডানের যোগ বাটনে চাপ দিয়ে প্রথম লেনদেন যোগ করুন।'
                    : 'Tap Add on the right to record your first income or expense.'
                }
              />
            ) : (
              <View style={styles.recentList}>
                {recent.map((tx) => (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    onDelete={load}
                  />
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
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.xxl,
    paddingBottom: 100,
  },
  skeletonContainer: {
    gap: Tokens.spacing.lg,
  },
  heroCard: {
    padding: Tokens.spacing.lg,
    borderRadius: Tokens.radius.card,
    gap: Tokens.spacing.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.xs,
  },
  dateLabel: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubtitle: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Tokens.spacing.sm,
  },
  heroAmount: {
    fontSize: Tokens.typography.hero.fontSize,
    lineHeight: Tokens.typography.hero.lineHeight,
    fontWeight: '800',
  },
  splitRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
  },
  splitCard: {
    flex: 1,
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radius.lg,
    gap: Tokens.spacing.xs,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitLabel: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '600',
  },
  splitAmount: {
    fontSize: Tokens.typography.title.fontSize,
    lineHeight: Tokens.typography.title.lineHeight,
    fontWeight: '700',
  },
  budgetCard: {
    padding: Tokens.spacing.lg,
    borderRadius: Tokens.radius.card,
    gap: Tokens.spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  budgetRatioText: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
  budgetSubtext: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  progressBarBase: {
    height: 8,
    borderRadius: Tokens.radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Tokens.radius.full,
  },
  noBudgetLabel: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    textAlign: 'center',
    paddingVertical: Tokens.spacing.xs,
  },
  linkText: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
  levelsCard: {
    padding: Tokens.spacing.lg,
    borderRadius: Tokens.radius.card,
    gap: Tokens.spacing.md,
  },
  levelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  levelsTitleWrap: {
    flex: 1,
    gap: 2,
  },
  levelsSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: Tokens.typography.body.fontSize,
    textAlign: 'center',
    paddingVertical: Tokens.spacing.sm,
  },
  levelsList: {
    gap: Tokens.spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  levelIcon: {
    width: 38,
    height: 38,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelContent: {
    flex: 1,
    gap: Tokens.spacing.xs,
  },
  levelTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelCategoryName: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
    flex: 1,
  },
  levelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  levelAmount: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
  levelProgressBase: {
    height: 6,
    borderRadius: Tokens.radius.full,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: Tokens.radius.full,
  },
  recentHeader: {
    minHeight: Tokens.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Tokens.spacing.sm,
  },
  recentTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  seeAllButton: {
    height: 36,
    paddingHorizontal: Tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  recentAdd: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Tokens.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recentAddLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  recentList: {
    gap: Tokens.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.section,
    gap: Tokens.spacing.md,
  },
  errorText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '600',
  },
  retryButton: {
    minHeight: Tokens.touchTarget,
    paddingHorizontal: Tokens.spacing.xl,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
});
