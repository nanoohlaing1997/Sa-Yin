import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonutChart, DonutSlice } from '@/components/DonutChart';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { TransactionRow } from '@/components/TransactionRow';
import { Card, EmptyState, ErrorBanner, Loader, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { getCategory } from '@/lib/categories';
import { formatMoney, formatSignedMoney } from '@/lib/format';
import { useMonth } from '@/lib/month-context';
import { useMonthSummary, useMonthTransactions } from '@/lib/transactions';
import { colors, radius, spacing } from '@/theme';

export default function ReportScreen() {
  const { user } = useAuth();
  const { month, setMonth } = useMonth();
  const router = useRouter();
  const { transactions, loading, error } = useMonthTransactions(user?.uid ?? null, month);
  const summary = useMonthSummary(transactions);

  const slices: DonutSlice[] = summary.byCategory.map((entry) => ({
    key: entry.categoryId,
    value: entry.total,
    color: getCategory(entry.categoryId).color,
  }));

  const recent = transactions.slice(0, 5);
  const firstName = user?.displayName?.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>
          {firstName ? `Hi, ${firstName}` : 'Your money'}
        </Text>

        <MonthSwitcher month={month} onChange={setMonth} />

        <ErrorBanner message={error} />

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net this month</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: summary.net < 0 ? colors.expense : colors.income },
            ]}
          >
            {formatSignedMoney(summary.net)}
          </Text>
          <View style={styles.totalsRow}>
            <Total label="Income" value={summary.income} color={colors.income} />
            <View style={styles.divider} />
            <Total label="Expenses" value={summary.expense} color={colors.expense} />
          </View>
        </Card>

        <SectionTitle>Spending by category</SectionTitle>
        <Card>
          {loading ? (
            <Loader />
          ) : summary.expense === 0 ? (
            <EmptyState
              title="No spending yet"
              body="Add an expense and this month’s breakdown shows up here."
            />
          ) : (
            <View style={styles.chartRow}>
              <DonutChart
                slices={slices}
                centerLabel="Spent"
                centerValue={formatMoney(summary.expense)}
              />
              <View style={styles.legend}>
                {summary.byCategory.slice(0, 6).map((entry) => {
                  const category = getCategory(entry.categoryId);
                  return (
                    <View key={entry.categoryId} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: category.color }]} />
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {category.label}
                      </Text>
                      <Text style={styles.legendValue}>
                        {Math.round(entry.share * 100)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Card>

        <View style={styles.recentHeader}>
          <SectionTitle>Recent</SectionTitle>
          <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <Card>
          {loading ? (
            <Loader />
          ) : recent.length === 0 ? (
            <EmptyState
              title="Nothing recorded"
              body="Tap the + button on the Transactions tab to add your first entry."
            />
          ) : (
            recent.map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <View style={styles.rowDivider} />}
                <TransactionRow
                  transaction={tx}
                  onPress={() => router.push({ pathname: '/transaction', params: { id: tx.id } })}
                />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Total({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, { color }]}>{formatMoney(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2), paddingBottom: spacing(4), gap: spacing(1.5) },
  greeting: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  balanceCard: { alignItems: 'center', paddingVertical: spacing(2.5) },
  balanceLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  balanceValue: { fontSize: 36, fontWeight: '800', marginTop: spacing(0.5) },
  totalsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing(2) },
  total: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  legend: { flex: 1, gap: spacing(1) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  legendLabel: { flex: 1, fontSize: 13, color: colors.text },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.muted },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(1),
  },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 14, marginBottom: spacing(1) },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },
});
