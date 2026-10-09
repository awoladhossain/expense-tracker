import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/screen';
import { getAllCategories, type CategoryRow } from '@/db/categories';
import { insertTransaction, type TransactionType } from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney, getCurrencySymbol, parseAmount } from '@/utils/currency';
import { addDays, formatDate, todayISO } from '@/utils/date';

export default function AddScreen() {
  const colors = useAppColors();
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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllCategories()
        .then((rows) => {
          if (!active) return;
          setCategories(rows);
          setCategoryId((current) => current ?? rows[0]?.id ?? null);
        })
        .catch((loadError) => {
          console.warn('Failed to load categories', loadError);
          if (active) setError(t.common.error);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [t.common.error]),
  );

  async function save() {
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
      await insertTransaction({
        amount: parsed,
        category_id: categoryId,
        type,
        note: note.trim() || null,
        date,
      });
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setAmount('');
      setNote('');
      setDate(todayISO());
      setType('expense');
      router.navigate('/');
    } catch (saveError) {
      console.warn('Failed to save transaction', saveError);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const parsedPreview = parseAmount(amount);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>
            {type === 'income' ? t.addExpense.titleIncome : t.addExpense.title}
          </Text>

          <View style={[styles.typeRow, { backgroundColor: colors.surfaceAlt }]}>
            <TypeButton
              label={t.addExpense.expense}
              selected={type === 'expense'}
              onPress={() => setType('expense')}
            />
            <TypeButton
              label={t.addExpense.income}
              selected={type === 'income'}
              onPress={() => setType('income')}
            />
          </View>

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
              style={[styles.amountInput, { color: colors.text }]}
            />
          </View>
          {parsedPreview ? (
            <Text style={[styles.preview, { color: colors.textMuted }]}>
              {formatMoney(parsedPreview, currency, language)}
            </Text>
          ) : null}

          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.category}</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
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
                    <CategoryIcon name={category.icon} color={category.color} size={18} />
                    <Text style={[styles.categoryLabel, { color: colors.text }]} numberOfLines={1}>
                      {language === 'bn' ? category.name_bn : category.name_en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.note}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.addExpense.notePlaceholder}
            placeholderTextColor={colors.textDisabled}
            style={[styles.note, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t.addExpense.date}</Text>
          <View style={styles.dateRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDate((current) => addDays(current, -1))}
              style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ChevronLeft color={colors.text} size={20} />
            </Pressable>
            <View style={styles.dateCopy}>
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date, language)}</Text>
              {date !== todayISO() ? (
                <Pressable accessibilityRole="button" onPress={() => setDate(todayISO())}>
                  <Text style={[styles.today, { color: colors.primary }]}>{language === 'bn' ? 'আজ' : 'Today'}</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDate((current) => addDays(current, 1))}
              style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ChevronRight color={colors.text} size={20} />
            </Pressable>
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={[styles.save, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveLabel}>
                {type === 'income' ? t.addExpense.saveIncome : t.addExpense.saveExpense}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function TypeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useAppColors();
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
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700' },
  typeRow: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  typeButton: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 15, fontWeight: '700' },
  amountBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: { fontSize: 28, fontWeight: '700' },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '800', paddingVertical: 12 },
  preview: { fontSize: 14, fontWeight: '600' },
  label: { marginTop: 8, fontSize: 15, fontWeight: '700' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: {
    width: '48%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  note: { borderWidth: 1, borderRadius: 14, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCopy: { flex: 1, alignItems: 'center', gap: 4 },
  dateText: { fontSize: 16, fontWeight: '700' },
  today: { fontSize: 14, fontWeight: '700' },
  error: { fontSize: 14, fontWeight: '600' },
  save: { marginTop: 8, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
