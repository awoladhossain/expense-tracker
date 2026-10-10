import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { AppInput } from '@/components/ui/app-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { getBudgetByMonth } from '@/db/budgets';
import { getCategoriesByType, type CategoryRow } from '@/db/categories';
import {
  getMonthlyTotal,
  insertTransaction,
  type TransactionType,
} from '@/db/transactions';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/toastStore';
import { formatMoney, getCurrencySymbol, parseAmount } from '@/utils/currency';
import { addDays, currentMonth, formatDate, todayISO } from '@/utils/date';
import { checkBudgetThresholdAlertAsync } from '@/utils/notifications';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>('expense');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dynamic category fetch based on active type
  const loadCategories = useCallback(async (activeType: TransactionType) => {
    setLoading(true);
    try {
      const rows = await getCategoriesByType(activeType);
      setCategories(rows);
    } catch (loadError) {
      if (__DEV__) {
        console.warn('Failed to load categories', loadError);
      }
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useFocusEffect(
    useCallback(() => {
      loadCategories(type);
    }, [loadCategories, type])
  );

  const handleTypeChange = (nextType: TransactionType) => {
    if (nextType === type) return;
    setType(nextType);
    setCategoryId(null); // Reset selection on switch to prevent category leakage
    setError(null);
    loadCategories(nextType);
  };

  async function save() {
    const parsed = parseAmount(amount);
    if (!amount.trim()) {
      setError(t.addExpense.errors.amountRequired);
      return;
    }
    if (!parsed || parsed <= 0) {
      setError(t.addExpense.errors.amountInvalid);
      return;
    }
    if (parsed > 100000000) {
      setError(t.validation.amountTooLarge);
      toast.error(t.validation.amountTooLarge);
      return;
    }
    if (note.trim().length > 255) {
      setError(t.validation.noteTooLong);
      toast.error(t.validation.noteTooLong);
      return;
    }
    if (!categoryId) {
      setError(t.addExpense.errors.categoryRequired);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await insertTransaction({
        amount: parsed,
        category_id: categoryId,
        type,
        note: note.trim() || null,
        date,
      });

      // Background check for budget threshold if this was an expense
      if (type === 'expense') {
        const month = currentMonth();
        Promise.all([getMonthlyTotal(month, 'expense'), getBudgetByMonth(month)])
          .then(([spentTotal, budget]) => {
            if (budget && budget.total_limit > 0) {
              checkBudgetThresholdAlertAsync({
                month,
                totalSpent: spentTotal,
                totalBudget: budget.total_limit,
                language,
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        });
      }

      // Fully reset form state
      setAmount('');
      setNote('');
      setDate(todayISO());
      setType('expense');
      setCategoryId(null);
      setError(null);

      toast.success(t.toast.transactionAdded);
      router.navigate('/');
    } catch (saveError) {
      if (__DEV__) {
        console.warn('Failed to save transaction', saveError);
      }
      setError(t.common.error);
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const parsedPreview = parseAmount(amount);
  const yesterday = addDays(todayISO(), -1);

  return (
    <Screen>
      <ScreenHeader
        title={type === 'income' ? t.addExpense.titleIncome : t.addExpense.title}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Segmented Type Toggle */}
          <View style={[styles.typeRow, { backgroundColor: colors.surfaceAlt }]}>
            <TypeButton
              label={t.addExpense.expense}
              selected={type === 'expense'}
              onPress={() => handleTypeChange('expense')}
            />
            <TypeButton
              label={t.addExpense.income}
              selected={type === 'income'}
              onPress={() => handleTypeChange('income')}
            />
          </View>

          {/* Amount Box */}
          <GlassCard style={styles.amountBox}>
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
              style={[styles.amountInput, { color: colors.text }]}
            />
          </GlassCard>

          {parsedPreview ? (
            <Text style={[styles.preview, { color: colors.textMuted }]}>
              {formatMoney(parsedPreview, currency, language)}
            </Text>
          ) : null}

          {/* Dynamic Categories Section */}
          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.category}</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.categories}>
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setCategoryId(category.id);
                      setError(null);
                    }}
                    style={[
                      styles.category,
                      {
                        backgroundColor: selected ? colors.primaryLight : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}>
                    <CategoryIcon name={category.icon} color={category.color} size={20} />
                    <Text style={[styles.categoryLabel, { color: colors.text }]} numberOfLines={1}>
                      {language === 'bn' ? category.name_bn : category.name_en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Note Input */}
          <AppInput
            label={t.addExpense.note}
            maxLength={255}
            value={note}
            onChangeText={setNote}
            placeholder={t.addExpense.notePlaceholder}
          />

          {/* Date Selector */}
          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.date}</Text>

          <View style={styles.dateChipsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDate(todayISO())}
              style={[
                styles.dateChip,
                {
                  backgroundColor: date === todayISO() ? colors.primaryLight : colors.surface,
                  borderColor: date === todayISO() ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.dateChipText,
                  { color: date === todayISO() ? colors.primary : colors.text },
                ]}>
                {language === 'bn' ? 'আজ' : 'Today'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setDate(yesterday)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: date === yesterday ? colors.primaryLight : colors.surface,
                  borderColor: date === yesterday ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.dateChipText,
                  { color: date === yesterday ? colors.primary : colors.text },
                ]}>
                {language === 'bn' ? 'গতকাল' : 'Yesterday'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.dateStepperRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDate((current) => addDays(current, -1))}
              style={styles.stepperButton}>
              <ChevronLeft color={colors.text} size={20} />
            </Pressable>
            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date, language)}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDate((current) => addDays(current, 1))}
              style={styles.stepperButton}>
              <ChevronRight color={colors.text} size={20} />
            </Pressable>
          </View>

          </ScrollView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <GradientButton
            disabled={saving}
            icon={Check}
            loading={saving}
            onPress={save}
            style={styles.saveButton}
            title={type === 'income' ? t.addExpense.saveIncome : t.addExpense.saveExpense}
            variant="primary"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function TypeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useThemeColor();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.typeButton, { backgroundColor: selected ? colors.surface : 'transparent' }]}>
      <Text style={[styles.typeLabel, { color: selected ? colors.text : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.lg,
  },
  title: {
    fontSize: Tokens.typography.headline.fontSize,
    lineHeight: Tokens.typography.headline.lineHeight,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    borderRadius: Tokens.radius.md,
    padding: Tokens.spacing.xs,
  },
  typeButton: {
    flex: 1,
    minHeight: Tokens.touchTarget,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '700',
  },
  amountBox: {
    marginTop: Tokens.spacing.xs,
    paddingHorizontal: Tokens.spacing.lg,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  symbol: {
    fontSize: Tokens.typography.headline.fontSize,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    fontSize: Tokens.typography.hero.fontSize,
    fontWeight: '800',
    paddingVertical: Tokens.spacing.sm,
  },
  preview: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
    marginTop: -Tokens.spacing.xs,
  },
  label: {
    marginTop: Tokens.spacing.xs,
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
  },
  loader: {
    marginVertical: Tokens.spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  category: {
    width: '48%',
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: Tokens.radius.md,
    paddingHorizontal: Tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  categoryLabel: {
    flex: 1,
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  dateChip: {
    minHeight: 36,
    paddingHorizontal: Tokens.spacing.lg,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipText: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  dateStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Tokens.radius.md,
    minHeight: 52,
    paddingHorizontal: Tokens.spacing.sm,
  },
  stepperButton: {
    width: Tokens.touchTarget,
    height: Tokens.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
  },
  error: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.sm,
    paddingBottom: Tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Tokens.spacing.sm,
  },
  saveButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
