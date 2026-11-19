import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { NextPaymentCard } from '@/components/NextPaymentCard';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, EmptyState, ErrorBanner, Loader, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/format';
import { useIncomeInRange, useIncomeSummary } from '@/lib/income';
import { usePeriod } from '@/lib/period-context';
import { colors, radius, shadow, spacing } from '@/theme';

export default function IncomeScreen() {
  const { user } = useAuth();
  const { start, end, noun } = usePeriod();
  const router = useRouter();
  const { income, loading, error } = useIncomeInRange(user?.uid ?? null, start, end);
  const summary = useIncomeSummary(income);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Franchise income" subtitle="Money in">
          <PeriodSwitcher />
        </ScreenHeader>

        <View style={styles.body}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Received {noun}</Text>
            <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(summary.total)}
            </Text>
            <Text style={styles.totalMeta}>
              {summary.count} {summary.count === 1 ? 'payment' : 'payments'}
            </Text>
          </View>

          <ErrorBanner message={error} />

          <NextPaymentCard />

          <SectionTitle>Payments received</SectionTitle>
          <Card style={styles.listCard}>
            {loading ? (
              <Loader />
            ) : income.length === 0 ? (
              <EmptyState
                emoji="💰"
                title={`No income ${noun}`}
                body="Record each payment you receive from your franchise."
                actionLabel="Record income"
                onAction={() => router.push('/income-entry')}
              />
            ) : (
              income.map((entry, i) => (
                <View key={entry.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <ActivityRow
                    kind="income"
                    title="Franchise payment"
                    subtitle={entry.note}
                    amount={entry.amount}
                    date={entry.date}
                    onPress={() =>
                      router.push({ pathname: '/income-entry', params: { id: entry.id } })
                    }
                  />
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 150 },
  body: { paddingHorizontal: spacing(2), gap: spacing(1.5), marginTop: spacing(0.5) },
  totalCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing(2.5),
    ...shadow,
    shadowOpacity: 0.12,
  },
  totalLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.income,
    marginTop: spacing(0.5),
    paddingHorizontal: spacing(2),
  },
  totalMeta: { fontSize: 13, color: colors.muted, marginTop: spacing(0.5) },
  listCard: { paddingVertical: spacing(0.5) },
  divider: { height: 1, backgroundColor: colors.border },
});
