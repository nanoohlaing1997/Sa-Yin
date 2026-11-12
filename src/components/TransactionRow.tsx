import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '@/lib/categories';
import { formatDate, formatMoney } from '@/lib/format';
import { Transaction } from '@/lib/transactions';
import { colors, radius, spacing } from '@/theme';

type Props = {
  transaction: Transaction;
  onPress?: () => void;
};

export function TransactionRow({ transaction, onPress }: Props) {
  const category = getCategory(transaction.categoryId);
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={[styles.icon, { backgroundColor: `${category.color}1A` }]}>
        <Text style={styles.iconText}>{category.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.note || category.label}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category.label} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.text }]}>
        {isIncome ? '+' : '−'}
        {formatMoney(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.25),
    gap: spacing(1.5),
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
