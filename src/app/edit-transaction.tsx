import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
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

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { AppInput } from '@/components/ui/app-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { getCategoriesByType, type CategoryRow } from '@/db/categories';
import {
  getTransactionById,
  updateTransaction,
  type TransactionType,
} from '@/db/transactions';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney, getCurrencySymbol, parseAmount } from '@/utils/currency';
import { addDays, formatDate, todayISO } from '@/utils/date';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = Number(id);

  const colors = useThemeColor();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>('expense');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async (activeType: TransactionType) => {
    setCategoriesLoading(true);
    try {
      const rows = await getCategoriesByType(activeType);
      setCategories(rows);
    } catch (loadErr) {
      console.warn('Failed to load categories', loadErr);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchTx() {
      if (!txId || isNaN(txId)) {
        setError(t.common.error);
        setInitialLoading(false);
        return;
      }
      try {
        const tx = await getTransactionById(txId);
        if (!active) return;
        if (!tx) {
          setError(t.history.noResults);
          setInitialLoading(false);
          return;
        }

        setAmount(String(tx.amount));
        setType(tx.type);
        setCategoryId(tx.category_id);
        setDate(tx.date);
        setNote(tx.note ?? '');

        const catRows = await getCategoriesByType(tx.type);
        if (active) {
          setCategories(catRows);
        }
      } catch (fetchErr) {
        console.warn('Failed to fetch transaction for editing', fetchErr);
        if (active) setError(t.common.error);
      } finally {
        if (active) setInitialLoading(false);
      }
    }

    fetchTx();

    return () => {
      active = false;
    };
  }, [t.common.error, t.history.noResults, txId]);

  const handleTypeChange = (nextType: TransactionType) => {
    if (nextType === type) return;
    setType(nextType);
    setCategoryId(null);
    setError(null);
    loadCategories(nextType);
  };

  async function handleSave() {
    const parsed = parseAmount(amount);
    if (!amount.trim()) {
      setError(t.addExpense.errors.amountRequired);
      return;
    }
    if (!parsed) {
      setError(t.addExpense.errors.amountInvalid);
      return;
    }
    if (!categoryId) {
      setError(t.addExpense.errors.categoryRequired);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateTransaction(txId, {
        amount: parsed,
        category_id: categoryId,
        type,
        note: note.trim() || null,
        date,
      });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        });
      }

      router.back();
    } catch (saveError) {
      console.warn('Failed to update transaction', saveError);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const parsedPreview = parseAmount(amount);
  const yesterday = addDays(todayISO(), -1);

  if (initialLoading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        rightAction={
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.back()}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.glassBorder,
              },
            ]}>
            <X color={colors.accent} size={20} />
          </Pressable>
        }
        title={language === 'bn' ? 'লেনদেন সম্পাদনা' : 'Edit Transaction'}
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

          {/* Categories Section */}
          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.category}</Text>
          {categoriesLoading ? (
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
              <Text style={[styles.dateChipText, { color: date === todayISO() ? colors.primary : colors.text }]}>
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
              <Text style={[styles.dateChipText, { color: date === yesterday ? colors.primary : colors.text }]}>
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

          {/* Error Message */}
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          {/* Save Button */}
          <GradientButton
            title={language === 'bn' ? 'আপডেট করুন' : 'Update Transaction'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
            style={styles.saveButton}
          />
        </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    paddingBottom: Tokens.spacing.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.xs,
  },
  title: {
    fontSize: Tokens.typography.headline.fontSize,
    lineHeight: Tokens.typography.headline.lineHeight,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveButton: {
    marginTop: Tokens.spacing.sm,
  },
});
