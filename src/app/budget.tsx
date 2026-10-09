import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { AppInput } from '@/components/ui/app-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { deleteBudget, getBudgetByMonth, upsertBudget } from '@/db/budgets';
import {
  getCategoriesByType,
  updateCategoryBudget,
  type CategoryRow,
} from '@/db/categories';
import { getMonthlyTotal } from '@/db/transactions';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney, getCurrencySymbol, parseAmount } from '@/utils/currency';
import { currentMonth, formatMonth } from '@/utils/date';

export default function BudgetScreen() {
  const colors = useThemeColor();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);

  const [totalAmount, setTotalAmount] = useState('');
  const [spent, setSpent] = useState(0);
  const [hasBudget, setHasBudget] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const month = currentMonth();
      const [budget, monthSpent, expenseCats] = await Promise.all([
        getBudgetByMonth(month),
        getMonthlyTotal(month, 'expense'),
        getCategoriesByType('expense'),
      ]);

      setSpent(monthSpent);
      setHasBudget(Boolean(budget));
      setTotalAmount(budget ? String(budget.total_limit) : '');
      setCategories(expenseCats);

      const limitsMap: Record<number, string> = {};
      for (const cat of expenseCats) {
        limitsMap[cat.id] = cat.budget_limit != null ? String(cat.budget_limit) : '';
      }
      setCategoryLimits(limitsMap);
      setError(null);
    } catch (loadError) {
      console.warn('Failed to load budget data', loadError);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSave() {
    const parsedTotal = parseAmount(totalAmount);
    if (!parsedTotal && totalAmount.trim().length > 0) {
      setError(t.addExpense.errors.amountInvalid);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (parsedTotal) {
        await upsertBudget(currentMonth(), parsedTotal);
      }

      // Update per-category budget limits
      for (const cat of categories) {
        const inputVal = categoryLimits[cat.id];
        const parsedLimit = inputVal && inputVal.trim().length > 0 ? parseAmount(inputVal) : null;
        await updateCategoryBudget(cat.id, parsedLimit);
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      closeBudget();
    } catch (saveError) {
      console.warn('Failed to save budget settings', saveError);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearTotalBudget() {
    setSaving(true);
    try {
      await deleteBudget(currentMonth());
      setTotalAmount('');
      setHasBudget(false);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (clearError) {
      console.warn('Failed to clear budget', clearError);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const parsedTotal = parseAmount(totalAmount);
  const remaining = parsedTotal ? parsedTotal - spent : null;

  function closeBudget() {
    if (router.canGoBack()) router.back();
    else router.navigate('/');
  }

  return (
    <Screen>
      <ScreenHeader
        rightAction={
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={closeBudget}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.glassBorder,
              },
            ]}>
            <ChevronLeft color={colors.accent} size={20} />
          </Pressable>
        }
        subtitle={formatMonth(currentMonth(), language)}
        title={hasBudget ? t.budget.editBudget : t.budget.setBudget}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {loading ? (
            <View style={styles.skeletonGroup}>
              <SkeletonLoader height={72} radius={Tokens.radius.lg} />
              <SkeletonLoader height={80} radius={Tokens.radius.lg} />
              <SkeletonLoader height={240} radius={Tokens.radius.card} />
            </View>
          ) : (
            <>
              {/* Total Monthly Budget Input */}
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                {t.budget.budgetAmount}
              </Text>
              <AppInput
                label={t.budget.monthlyBudget}
                value={totalAmount}
                onChangeText={(val) => {
                  setTotalAmount(val);
                  setError(null);
                }}
                numeric
                placeholder="10000"
              />

              {/* Status summary */}
              <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>
                    {t.budget.spent}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatMoney(spent, currency, language)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>
                    {remaining !== null && remaining < 0 ? t.budget.overBudget : t.budget.remaining}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: remaining !== null && remaining < 0 ? colors.danger : colors.success },
                    ]}>
                    {remaining !== null ? formatMoney(Math.abs(remaining), currency, language) : '—'}
                  </Text>
                </View>
              </GlassCard>

              {/* Per-Category Budget Limits */}
              <View style={styles.categorySectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  {t.budget.categoryBudgets}
                </Text>
                <Text style={[styles.categorySectionSubtitle, { color: colors.textMuted }]}>
                  {language === 'bn'
                    ? 'প্রতিটি ক্যাটাগরির নিজস্ব খরচের সীমা (ঐচ্ছিক)'
                    : 'Individual category spending limits (optional)'}
                </Text>
              </View>

              <GlassCard style={styles.categoryListCard}>
                {categories.map((cat) => (
                  <View key={cat.id} style={[styles.catRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}20` }]}>
                      <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                    </View>
                    <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                      {language === 'bn' ? cat.name_bn : cat.name_en}
                    </Text>

                    <View style={[styles.catInputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                      <Text style={[styles.catCurrency, { color: colors.textMuted }]}>
                        {getCurrencySymbol(currency)}
                      </Text>
                      <TextInput
                        value={categoryLimits[cat.id] ?? ''}
                        onChangeText={(val) => {
                          setCategoryLimits((prev) => ({ ...prev, [cat.id]: val }));
                          setError(null);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textDisabled}
                        style={[styles.catInput, { color: colors.text }]}
                      />
                    </View>
                  </View>
                ))}
              </GlassCard>

              {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

              {/* Save Button */}
              <GradientButton
                title={t.common.save}
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                variant="primary"
                style={styles.saveBtn}
              />

              {/* Delete / Clear Total Budget Button */}
              {hasBudget ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={handleClearTotalBudget}
                  style={styles.clearBtn}>
                  <Text style={[styles.clearText, { color: colors.danger }]}>
                    {t.common.delete}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    marginBottom: Tokens.spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Tokens.typography.headline.fontSize,
    lineHeight: Tokens.typography.headline.lineHeight,
    fontWeight: '700',
  },
  monthLabel: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '600',
  },
  skeletonGroup: {
    gap: Tokens.spacing.md,
    paddingTop: Tokens.spacing.sm,
  },
  sectionLabel: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
  },
  categorySectionHeader: {
    gap: 2,
    marginTop: Tokens.spacing.sm,
  },
  categorySectionSubtitle: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '500',
  },
  summaryCard: {
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radius.lg,
    gap: Tokens.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMeta: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
  },
  categoryListCard: {
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radius.card,
    gap: Tokens.spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    flex: 1,
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  catInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: Tokens.spacing.sm,
    width: 100,
    minHeight: 38,
    gap: 4,
  },
  catCurrency: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '700',
  },
  catInput: {
    flex: 1,
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '700',
    padding: 0,
    margin: 0,
  },
  error: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: Tokens.spacing.sm,
  },
  clearBtn: {
    minHeight: Tokens.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
});
