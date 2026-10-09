import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { deleteBudget, getBudgetByMonth, upsertBudget } from '@/db/budgets';
import { getMonthlyTotal } from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney, getCurrencySymbol, parseAmount } from '@/utils/currency';
import { currentMonth, formatMonth } from '@/utils/date';

export default function BudgetScreen() {
  const colors = useAppColors();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const [amount, setAmount] = useState('');
  const [spent, setSpent] = useState(0);
  const [hasBudget, setHasBudget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const month = currentMonth();
      const [budget, monthSpent] = await Promise.all([getBudgetByMonth(month), getMonthlyTotal(month, 'expense')]);
      setSpent(monthSpent);
      setHasBudget(Boolean(budget));
      setAmount(budget ? String(budget.total_limit) : '');
      setError(null);
    } catch (loadError) {
      console.warn('Failed to load budget', loadError);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    const parsed = parseAmount(amount);
    if (!parsed) {
      setError(t.addExpense.errors.amountInvalid);
      return;
    }
    setSaving(true);
    try {
      await upsertBudget(currentMonth(), parsed);
      closeBudget();
    } catch (saveError) {
      console.warn('Failed to save budget', saveError);
      setError(t.common.error);
      setSaving(false);
    }
  }

  async function clearBudget() {
    setSaving(true);
    try {
      await deleteBudget(currentMonth());
      setAmount('');
      setHasBudget(false);
    } catch (clearError) {
      console.warn('Failed to clear budget', clearError);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const parsed = parseAmount(amount);
  const remaining = parsed ? parsed - spent : null;

  function closeBudget() {
    if (router.canGoBack()) router.back();
    else router.navigate('/');
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={closeBudget} style={styles.back}>
          <Text style={[styles.backLabel, { color: colors.primary }]}>{t.common.cancel}</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{hasBudget ? t.budget.editBudget : t.budget.setBudget}</Text>
        <Text style={[styles.month, { color: colors.textMuted }]}>{formatMonth(currentMonth(), language)}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={[styles.label, { color: colors.text }]}>{t.budget.budgetAmount}</Text>
            <View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.symbol, { color: colors.textMuted }]}>{getCurrencySymbol(currency)}</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(value);
                  setError(null);
                }}
                keyboardType="decimal-pad"
                placeholder={t.addExpense.amountPlaceholder}
                placeholderTextColor={colors.textDisabled}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {t.budget.spent}: {formatMoney(spent, currency, language)}
              </Text>
              {remaining !== null ? (
                <Text style={[styles.meta, { color: remaining < 0 ? colors.danger : colors.text }]}>
                  {remaining < 0 ? t.budget.overBudget : t.budget.remaining}: {formatMoney(Math.abs(remaining), currency, language)}
                </Text>
              ) : (
                <Text style={[styles.meta, { color: colors.textMuted }]}>{t.budget.noBudgetSet}</Text>
              )}
            </View>
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={save}
              style={[styles.save, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
              <Text style={styles.saveLabel}>{t.common.save}</Text>
            </Pressable>
            {hasBudget ? (
              <Pressable accessibilityRole="button" disabled={saving} onPress={clearBudget} style={styles.clear}>
                <Text style={[styles.clearLabel, { color: colors.danger }]}>{t.common.delete}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, gap: 12 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backLabel: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700' },
  month: { fontSize: 15, fontWeight: '600', marginTop: -4 },
  loader: { marginTop: 32 },
  label: { marginTop: 8, fontSize: 15, fontWeight: '700' },
  amountBox: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: { fontSize: 22, fontWeight: '700' },
  input: { flex: 1, fontSize: 28, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  meta: { fontSize: 15, fontWeight: '600' },
  error: { fontSize: 14, fontWeight: '600' },
  save: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  clear: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearLabel: { fontSize: 16, fontWeight: '700' },
});
