import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthSwitcher } from '@/components/MonthSwitcher';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState, ErrorBanner, Loader } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatMoney } from '@/lib/format';
import { useMonth } from '@/lib/month-context';
import { Transaction, useMonthTransactions } from '@/lib/transactions';
import { colors, radius, shadow, spacing } from '@/theme';

type Section = { title: string; total: number; data: Transaction[] };

/** Groups a date-descending list into one section per day. */
function groupByDay(transactions: Transaction[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const tx of transactions) {
    const title = formatDate(tx.date);
    if (!current || current.title !== title) {
      current = { title, total: 0, data: [] };
      sections.push(current);
    }
    current.data.push(tx);
    current.total += tx.type === 'income' ? tx.amount : -tx.amount;
  }

  return sections;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { month, setMonth } = useMonth();
  const router = useRouter();
  const { transactions, loading, error } = useMonthTransactions(user?.uid ?? null, month);
  const sections = useMemo(() => groupByDay(transactions), [transactions]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <MonthSwitcher month={month} onChange={setMonth} />
        <ErrorBanner message={error} />
      </View>

      {loading ? (
        <Loader />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState
              title="No transactions this month"
              body="Tap + to record what you spent or earned."
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text
                style={[
                  styles.sectionTotal,
                  { color: section.total < 0 ? colors.muted : colors.income },
                ]}
              >
                {section.total < 0 ? '−' : '+'}
                {formatMoney(Math.abs(section.total))}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <TransactionRow
                transaction={item}
                onPress={() =>
                  router.push({ pathname: '/transaction', params: { id: item.id } })
                }
              />
            </View>
          )}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        onPress={() => router.push('/transaction')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(2), paddingBottom: spacing(1), gap: spacing(1) },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  list: { padding: spacing(2), paddingBottom: spacing(12) },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(0.5),
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted },
  sectionTotal: { fontSize: 13, fontWeight: '700' },
  rowWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    marginBottom: spacing(0.75),
    ...shadow,
  },
  fab: {
    position: 'absolute',
    right: spacing(2.5),
    bottom: spacing(3),
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.25,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '400' },
});
