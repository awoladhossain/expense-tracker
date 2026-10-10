import { router } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { CategoryIcon } from '@/components/category-icon';
import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { deleteTransaction, type TransactionRow } from '@/db/transactions';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMoney } from '@/utils/currency';

export interface TransactionListItemProps {
  transaction: TransactionRow;
  onDelete?: () => void;
}

export function TransactionListItem({
  transaction,
  onDelete,
}: TransactionListItemProps) {
  const colors = useThemeColor();
  const { language, t } = useI18n();
  const currency = useSettingsStore((state) => state.currency);
  const swipeableRef = useRef<SwipeableMethods>(null);

  const name =
    language === 'bn'
      ? (transaction.category_name_bn ?? '')
      : (transaction.category_name_en ?? '');
  const isIncome = transaction.type === 'income';
  const amount = formatMoney(transaction.amount, currency, language);

  const handleEdit = () => {
    swipeableRef.current?.close();
    router.push({
      pathname: '/edit-transaction',
      params: { id: String(transaction.id) },
    });
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    Alert.alert(
      t.history.deleteConfirmTitle,
      t.history.deleteConfirmMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              onDelete?.();
            } catch (err) {
              console.warn('Failed to delete transaction', err);
              Alert.alert(t.common.error);
            }
          },
        },
      ]
    );
  };

  const renderLeftActions = () => (
    <Pressable
      accessibilityRole="button"
      onPress={handleDelete}
      style={[styles.leftSwipeAction, { backgroundColor: colors.danger }]}>
      <Trash2 color="#FFFFFF" size={20} />
      <Text style={styles.actionText}>{t.common.delete}</Text>
    </Pressable>
  );

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      onPress={handleEdit}
      style={[styles.rightSwipeAction, { backgroundColor: colors.accent }]}>
      <Pencil color="#FFFFFF" size={20} />
      <Text style={styles.actionText}>{t.common.edit}</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      overshootFriction={8}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}>
      <Pressable
        accessibilityRole="button"
        onPress={handleEdit}
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View
          style={[
            styles.icon,
            { backgroundColor: `${transaction.category_color ?? colors.primary}22` },
          ]}>
          <CategoryIcon
            name={transaction.category_icon ?? 'Ellipsis'}
            color={transaction.category_color ?? colors.primary}
            size={20}
          />
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

        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.success : colors.text },
          ]}>
          {isIncome ? `+${amount}` : `−${amount}`}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    borderWidth: 1,
    borderRadius: Tokens.radius.lg,
    paddingVertical: Tokens.spacing.md,
    paddingHorizontal: Tokens.spacing.md,
    minHeight: 64,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '600',
  },
  note: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
  },
  amount: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
  },
  leftSwipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Tokens.radius.lg,
    marginRight: Tokens.spacing.xs,
    gap: 4,
  },
  rightSwipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Tokens.radius.lg,
    marginLeft: Tokens.spacing.xs,
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
  },
});
