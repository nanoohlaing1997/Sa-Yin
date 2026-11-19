import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { toDayString } from '@/lib/day';
import { addDays, daysBetween, formatDate } from '@/lib/format';
import { PAYMENT_CYCLE_DAYS, useLatestIncome } from '@/lib/income';
import { colors, radius, shadow, spacing } from '@/theme';

/** "Next franchise payment due …" — last payment + 28 days, with a one-tap record. */
export function NextPaymentCard() {
  const { user } = useAuth();
  const router = useRouter();
  const latest = useLatestIncome(user?.uid ?? null);

  if (!latest) return null;

  const due = addDays(latest.date, PAYMENT_CYCLE_DAYS);
  const days = daysBetween(new Date(), due);
  const status =
    days > 1
      ? `in ${days} days`
      : days === 1
        ? 'tomorrow'
        : days === 0
          ? 'due today'
          : `${-days} ${days === -1 ? 'day' : 'days'} overdue`;
  const urgent = days <= 0;

  return (
    <View style={styles.card}>
      <View style={[styles.icon, urgent && { backgroundColor: '#FFF1D6' }]}>
        <Text style={styles.emoji}>{urgent ? '⏰' : '📆'}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>Next franchise payment</Text>
        <Text style={styles.date}>
          {formatDate(due)}{' '}
          <Text style={[styles.status, urgent && { color: '#B7791F' }]}>· {status}</Text>
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Record payment for ${formatDate(due)}`}
        onPress={() =>
          router.push({
            pathname: '/income-entry',
            params: { day: toDayString(due) },
          })
        }
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.buttonText}>Record</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(1.75),
    ...shadow,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E3F6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  text: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  date: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },
  status: { fontSize: 13, fontWeight: '600', color: colors.income },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1),
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
