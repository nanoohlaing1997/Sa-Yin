import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatMoney } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Props = {
  kind: 'income' | 'supplies';
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  onPress?: () => void;
};

/** One money-in or money-out line, used on Home and the list tabs. */
export function ActivityRow({ kind, title, subtitle, amount, date, onPress }: Props) {
  const isIncome = kind === 'income';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View
        style={[styles.icon, { backgroundColor: isIncome ? '#E3F6EE' : '#FCE7F2' }]}
      >
        <Text style={styles.iconText}>{isIncome ? '💰' : '🛒'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {subtitle ? `${subtitle} · ` : ''}
          {formatDate(date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.text }]}>
        {isIncome ? '+' : '−'}
        {formatMoney(amount)}
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
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
