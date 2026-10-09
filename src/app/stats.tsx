import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { getAllCategories } from '@/db/categories';
import { getCategoryTotalsBetween, getTotalBetween } from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';
import { currentMonth, currentWeekRange, formatMonth, getMonthRange, todayISO } from '@/utils/date';

type Period = 'daily' | 'weekly' | 'monthly';

type CategoryBar = {
  id: number;
  nameEn: string;
  nameBn: string;
  icon: string;
  color: string;
  total: number;
};

function rangeFor(period: Period) {
  if (period === 'daily') {
    const today = todayISO();
    return { start: today, end: today };
  }
  if (period === 'weekly') return currentWeekRange();
  return getMonthRange(currentMonth());
}

export default function StatsScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [categories, setCategories] = useState<CategoryBar[]>([]);

  const load = useCallback(async () => {
    try {
      const range = rangeFor(period);
      const [spent, earned, allCategories, totals] = await Promise.all([
        getTotalBetween(range.start, range.end, 'expense'),
        getTotalBetween(range.start, range.end, 'income'),
        getAllCategories(),
        getCategoryTotalsBetween(range.start, range.end, 'expense'),
      ]);
      const totalByCategory = new Map(totals.map((row) => [row.category_id, row.total]));
      setExpense(spent);
      setIncome(earned);
      setCategories(
        allCategories
          .map((category) => ({
            id: category.id,
            nameEn: category.name_en,
            nameBn: category.name_bn,
            icon: category.icon,
            color: category.color,
            total: totalByCategory.get(category.id) ?? 0,
          }))
          .filter((category) => category.total > 0)
          .sort((a, b) => b.total - a.total),
      );
      setFailed(false);
    } catch (error) {
      console.warn('Failed to load stats', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const max = Math.max(...categories.map((category) => category.total), 1);
  const periods: { id: Period; label: string }[] = [
    { id: 'daily', label: t.stats.daily },
    { id: 'weekly', label: t.stats.weekly },
    { id: 'monthly', label: t.stats.monthly },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t.stats.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {period === 'monthly' ? formatMonth(currentMonth(), language) : t.stats[period]}
        </Text>
        <View style={[styles.segments, { backgroundColor: colors.surfaceAlt }]}>
          {periods.map((item) => {
            const selected = period === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  setPeriod(item.id);
                }}
                style={[styles.segment, { backgroundColor: selected ? colors.surface : 'transparent' }]}>
                <Text style={[styles.segmentLabel, { color: selected ? colors.text : colors.textMuted }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : failed ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>{t.common.error}</Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <StatLine label={t.stats.totalExpense} value={formatMoney(expense, currency, language)} color={colors.text} muted={colors.textMuted} />
              <StatLine label={t.stats.totalIncome} value={formatMoney(income, currency, language)} color={colors.success} muted={colors.textMuted} />
              <StatLine
                label={t.stats.netSavings}
                value={formatMoney(income - expense, currency, language)}
                color={income - expense >= 0 ? colors.success : colors.danger}
                muted={colors.textMuted}
              />
            </View>
            {categories.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{t.common.noData}</Text>
            ) : (
              categories.map((category) => (
                <View key={category.id} style={styles.barRow}>
                  <View style={styles.barHeader}>
                    <View style={styles.barTitle}>
                      <CategoryIcon name={category.icon} color={category.color} size={16} />
                      <Text style={[styles.barName, { color: colors.text }]} numberOfLines={1}>
                        {language === 'bn' ? category.nameBn : category.nameEn}
                      </Text>
                    </View>
                    <Text style={[styles.barAmount, { color: colors.text }]}>
                      {formatMoney(category.total, currency, language)}
                    </Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.fill, { backgroundColor: category.color, width: `${(category.total / max) * 100}%` }]} />
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatLine({ label, value, color, muted }: { label: string; value: string; color: string; muted: string }) {
  return (
    <View style={styles.statLine}>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, fontWeight: '600', marginTop: -8 },
  segments: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segment: { flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontSize: 14, fontWeight: '700' },
  loader: { marginTop: 32 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statLabel: { fontSize: 15, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', fontSize: 15 },
  barRow: { gap: 8 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  barTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  barName: { flex: 1, fontSize: 15, fontWeight: '600' },
  barAmount: { fontSize: 14, fontWeight: '700' },
  track: { height: 8, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
});
