/* eslint-disable react-hooks/immutability */
import { useFocusEffect } from 'expo-router';
import { ChartColumn, CircleOff } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassCard } from '@/components/ui/glass-card';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { Tokens } from '@/constants/tokens';
import { getCategoriesByType } from '@/db/categories';
import {
  getCategoryTotalsBetween,
  getTotalBetween,
  type TransactionType,
} from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';
import {
  currentMonth,
  currentWeekRange,
  formatMonth,
  getMonthRange,
  getYearRange,
  toBengaliNumerals,
} from '@/utils/date';
import { getLevel, getLevelEmoji } from '@/utils/level';

type Period = 'weekly' | 'monthly' | 'yearly';

interface CategoryBar {
  id: number;
  nameEn: string;
  nameBn: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
  budgetLimit: number | null;
}

function rangeFor(period: Period) {
  const now = new Date();
  if (period === 'weekly') return currentWeekRange();
  if (period === 'monthly') return getMonthRange(currentMonth());
  return getYearRange(now.getFullYear());
}

export default function StatsScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);

  const [txType, setTxType] = useState<TransactionType>('expense');
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categories, setCategories] = useState<CategoryBar[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const range = rangeFor(period);
      const [spent, earned, typedCategories, totals] = await Promise.all([
        getTotalBetween(range.start, range.end, 'expense'),
        getTotalBetween(range.start, range.end, 'income'),
        getCategoriesByType(txType),
        getCategoryTotalsBetween(range.start, range.end, txType),
      ]);

      setTotalExpense(spent);
      setTotalIncome(earned);

      const totalByCategory = new Map(totals.map((row) => [row.category_id, row.total]));
      const activeTotal = txType === 'expense' ? spent : earned;

      const mapped: CategoryBar[] = typedCategories
        .map((cat) => {
          const catTotal = totalByCategory.get(cat.id) ?? 0;
          const percentage = activeTotal > 0 ? (catTotal / activeTotal) * 100 : 0;
          return {
            id: cat.id,
            nameEn: cat.name_en,
            nameBn: cat.name_bn,
            icon: cat.icon,
            color: cat.color,
            total: catTotal,
            percentage,
            budgetLimit: cat.budget_limit,
          };
        })
        .filter((cat) => cat.total > 0)
        .sort((a, b) => b.total - a.total);

      setCategories(mapped);
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load stats', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [period, txType]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const periods: { id: Period; label: string }[] = [
    { id: 'weekly', label: t.stats.weekly },
    { id: 'monthly', label: t.stats.monthly },
    { id: 'yearly', label: t.stats.yearly },
  ];

  const currentTotal = txType === 'expense' ? totalExpense : totalIncome;
  const topCategories = categories.slice(0, 5);

  return (
    <Screen>
      <ScreenHeader
        subtitle={
          period === 'monthly'
            ? formatMonth(currentMonth(), language)
            : period === 'yearly'
              ? language === 'bn'
                ? `${toBengaliNumerals(new Date().getFullYear())} সাল`
                : `${new Date().getFullYear()} Year`
              : t.stats.weekly
        }
        title={t.stats.title}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. TOP SEGMENTED CONTROL: Expense | Income */}
        <View style={[styles.typeSegments, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTxType('expense')}
            style={[
              styles.typeSegment,
              { backgroundColor: txType === 'expense' ? colors.danger : 'transparent' },
            ]}>
            <Text
              style={[
                styles.typeSegmentText,
                { color: txType === 'expense' ? '#FFFFFF' : colors.textMuted },
              ]}>
              {t.addExpense.expense}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTxType('income')}
            style={[
              styles.typeSegment,
              { backgroundColor: txType === 'income' ? colors.success : 'transparent' },
            ]}>
            <Text
              style={[
                styles.typeSegmentText,
                { color: txType === 'income' ? '#FFFFFF' : colors.textMuted },
              ]}>
              {t.addExpense.income}
            </Text>
          </Pressable>
        </View>

        {/* 2. PERIOD SWITCH CHIPS: Week / Month / Year */}
        <View style={styles.periodRow}>
          {periods.map((p) => {
            const isSelected = period === p.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={p.id}
                onPress={() => setPeriod(p.id)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.periodChipText,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. FINANCIAL SUMMARY CARD */}
        <GlassCard style={styles.summaryCard}>
          <StatLine
            color={colors.text}
            label={t.stats.totalExpense}
            muted={colors.textMuted}
            value={formatMoney(totalExpense, currency, language)}
          />
          <StatLine
            color={colors.success}
            label={t.stats.totalIncome}
            muted={colors.textMuted}
            value={formatMoney(totalIncome, currency, language)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatLine
            color={totalIncome - totalExpense >= 0 ? colors.success : colors.danger}
            label={t.stats.netSavings}
            muted={colors.textMuted}
            value={formatMoney(totalIncome - totalExpense, currency, language)}
          />
        </GlassCard>

        {/* 4. DONUT CHART & TOP 5 LIST WITH SKELETON */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonLoader height={180} radius={Tokens.radius.card} />
            <SkeletonLoader height={60} radius={Tokens.radius.md} />
            <SkeletonLoader height={60} radius={Tokens.radius.md} />
            <SkeletonLoader height={60} radius={Tokens.radius.md} />
          </View>
        ) : failed ? (
          <EmptyState
            description={t.common.error}
            icon={ChartColumn}
            title={t.common.error}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            description={
              txType === 'expense' ? t.stats.noExpenseData : t.stats.noIncomeData
            }
            icon={CircleOff}
            title={t.common.noData}
          />
        ) : (
          <>
            {/* Donut Chart Representation */}
            <GlassCard style={styles.chartCard}>
              <View style={styles.chartWrapper}>
                <DonutChart categories={categories} total={currentTotal} />
                <View style={styles.chartCenterText}>
                  <Text style={[styles.chartCenterLabel, { color: colors.textMuted }]}>
                    {txType === 'expense' ? t.addExpense.expense : t.addExpense.income}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.chartCenterValue,
                      { color: txType === 'expense' ? colors.danger : colors.success },
                    ]}>
                    {formatMoney(currentTotal, currency, language)}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* TOP 5 BREAKDOWN LIST */}
            <SectionHeader
              title={
                language === 'bn'
                  ? `শীর্ষ ৫ ${txType === 'expense' ? 'খরচের' : 'আয়ের'} খাত`
                  : `Top 5 ${txType === 'expense' ? 'Expense' : 'Income'} Categories`
              }
            />

            <View style={styles.breakdownList}>
              {topCategories.map((cat, index) => {
                const categoryName = language === 'bn' ? cat.nameBn : cat.nameEn;
                const formattedPercent = `${cat.percentage.toFixed(1)}%`;
                const displayPercent =
                  language === 'bn'
                    ? `${toBengaliNumerals(cat.percentage.toFixed(1))}%`
                    : formattedPercent;

                // Level computation for expense categories only
                const level =
                  txType === 'expense'
                    ? getLevel(cat.total, cat.budgetLimit ?? currentTotal / 5)
                    : null;

                return (
                  <GlassCard key={cat.id} style={styles.catItemCard}>
                    <View style={styles.catItemHeader}>
                      <View style={styles.catItemLeft}>
                        <View
                          style={[
                            styles.catRank,
                            { backgroundColor: colors.surfaceAlt },
                          ]}>
                          <Text style={[styles.catRankText, { color: colors.textMuted }]}>
                            {language === 'bn' ? toBengaliNumerals(index + 1) : `#${index + 1}`}
                          </Text>
                        </View>
                        <CategoryIcon
                          color={cat.color}
                          name={cat.icon}
                          size={18}
                        />
                        <Text
                          numberOfLines={1}
                          style={[styles.catName, { color: colors.text }]}>
                          {categoryName}
                        </Text>
                      </View>

                      <View style={styles.catItemRight}>
                        <Text style={[styles.catAmount, { color: colors.text }]}>
                          {formatMoney(cat.total, currency, language)}
                        </Text>
                        <Badge label={displayPercent} variant="neutral" />
                        {level && (
                          <Text style={styles.catLevelEmoji}>
                            {getLevelEmoji(level)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View
                      style={[
                        styles.progressBarTrack,
                        { backgroundColor: colors.surfaceAlt },
                      ]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: cat.color,
                            width: `${Math.min(cat.percentage, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatLine({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.statLine}>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

/**
 * Donut Chart rendered with pure react-native-svg
 */
function DonutChart({
  categories,
  total,
}: {
  categories: CategoryBar[];
  total: number;
}) {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate strokeDasharray & strokeDashoffset cleanly
  let cumulativeOffset = 0;
  const slices = categories.map((cat) => {
    const sliceFraction = total > 0 ? cat.total / total : 0;
    const strokeDasharray = `${sliceFraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset * circumference;
    cumulativeOffset += sliceFraction;
    return {
      id: cat.id,
      color: cat.color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <Svg height={size} width={size}>
      <G origin={`${size / 2}, ${size / 2}`} rotation="-90">
        {slices.map((slice) => (
          <Circle
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            key={slice.id}
            r={radius}
            stroke={slice.color}
            strokeDasharray={slice.strokeDasharray}
            strokeDashoffset={slice.strokeDashoffset}
            strokeWidth={strokeWidth}
          />
        ))}
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: Tokens.typography.hero.fontSize,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
    marginTop: -4,
  },
  typeSegments: {
    flexDirection: 'row',
    borderRadius: Tokens.radius.md,
    padding: 4,
    gap: 4,
  },
  typeSegment: {
    flex: 1,
    minHeight: 42,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSegmentText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  periodChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipText: {
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
  },
  summaryCard: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
  },
  statValue: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  skeletonContainer: {
    gap: Tokens.spacing.md,
    marginTop: Tokens.spacing.sm,
  },
  chartCard: {
    padding: Tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  chartCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    gap: 2,
  },
  chartCenterLabel: {
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chartCenterValue: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '800',
  },
  breakdownList: {
    gap: Tokens.spacing.sm,
  },
  catItemCard: {
    padding: Tokens.spacing.md,
    gap: Tokens.spacing.sm,
  },
  catItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    flex: 1,
  },
  catRank: {
    width: 24,
    height: 24,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catName: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  catItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  catAmount: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '700',
    marginRight: 2,
  },
  catLevelEmoji: {
    fontSize: 14,
    marginLeft: 2,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: Tokens.radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Tokens.radius.full,
  },
});
