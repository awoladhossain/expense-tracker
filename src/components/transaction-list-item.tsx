import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import type { TransactionRow } from '@/db/transactions';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';

export function TransactionListItem({
  transaction,
  onDelete,
}: {
  transaction: TransactionRow;
  onDelete?: () => void;
}) {
  const colors = useAppColors();
  const { language } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const name =
    language === 'bn'
      ? (transaction.category_name_bn ?? '')
      : (transaction.category_name_en ?? '');
  const isIncome = transaction.type === 'income';
  const amount = formatMoney(transaction.amount, currency, language);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: `${transaction.category_color ?? colors.primary}22` }]}>
        <CategoryIcon name={transaction.category_icon ?? 'Ellipsis'} color={transaction.category_color ?? colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {transaction.note ? (
          <Text style={[styles.note, { color: colors.textMuted }]} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text }]}>
        {isIncome ? `+${amount}` : amount}
      </Text>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDelete}
          style={styles.delete}>
          <Trash2 color={colors.danger} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 64,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: '700' },
  delete: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
