import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { DonutChart, DonutSlice } from '@/components/DonutChart';
import { NextPaymentCard } from '@/components/NextPaymentCard';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, EmptyState, ErrorBanner, Loader, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { formatMoney, formatSignedMoney } from '@/lib/format';
import { useIncomeInRange, useIncomeSummary } from '@/lib/income';
import { usePeriod } from '@/lib/period-context';
import { usePurchasesInRange, usePurchaseSummary } from '@/lib/purchases';
import { colors, radius, spacing } from '@/theme';

const PALETTE = ['#D6177F', '#8E4EC6', '#2F6BFF', '#0E7C86', '#F2A93B', '#14A06B', '#E5484D'];

type Activity =
  | { kind: 'income'; id: string; date: Date; title: string; subtitle: string; amount: number }
  | { kind: 'supplies'; id: string; date: Date; title: string; subtitle: string; amount: number };

export default function HomeScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { start, end, noun } = usePeriod();
  const router = useRouter();

  const incomeState = useIncomeInRange(uid, start, end);
  const purchaseState = usePurchasesInRange(uid, start, end);
  const incomeSummary = useIncomeSummary(incomeState.income);
  const purchaseSummary = usePurchaseSummary(purchaseState.purchases);

  const loading = incomeState.loading || purchaseState.loading;
  const error = incomeState.error ?? purchaseState.error;
  const net = incomeSummary.total - purchaseSummary.total;

  const recent = useMemo<Activity[]>(() => {
    const rows: Activity[] = [
      ...incomeState.income.map((e) => ({
        kind: 'income' as const,
        id: e.id,
        date: e.date,
        title: 'Franchise payment',
        subtitle: e.note,
        amount: e.amount,
      })),
      ...purchaseState.purchases.map((p) => ({
        kind: 'supplies' as const,
        id: p.id,
        date: p.date,
        title: p.storeName,
        subtitle: `${p.lines.length} ${p.lines.length === 1 ? 'item' : 'items'}`,
        amount: p.total,
      })),
    ];
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  }, [incomeState.income, purchaseState.purchases]);

  const stores = purchaseSummary.byStore;
  const slices: DonutSlice[] = stores.map((s, i) => ({
    key: s.storeId || s.storeName,
    value: s.total,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Sa Yin" subtitle="Sushi bar ledger">
          <PeriodSwitcher />
        </ScreenHeader>

        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroLabel}>
              {net < 0 ? 'Loss' : 'Profit'} {noun}
            </Text>
            <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatSignedMoney(net)}
            </Text>
            <View style={styles.totals}>
              <Total label="Money in" value={incomeSummary.total} arrow="↓" />
              <View style={styles.totalsDivider} />
              <Total label="Supplies" value={purchaseSummary.total} arrow="↑" />
            </View>
          </View>

          <ErrorBanner message={error} />

          <NextPaymentCard />

          <SectionTitle>Supplies by store</SectionTitle>
          <Card>
            {loading ? (
              <Loader />
            ) : purchaseSummary.total === 0 ? (
              <EmptyState
                emoji="🛒"
                title="No purchases yet"
                body="Your spending by store shows up here."
                actionLabel="Record a purchase"
                onAction={() => router.push('/purchase')}
              />
            ) : (
              <View style={styles.chartRow}>
                <DonutChart
                  slices={slices}
                  size={150}
                  thickness={20}
                  centerLabel="Spent"
                  centerValue={formatMoney(purchaseSummary.total)}
                />
                <View style={styles.legend}>
                  {stores.slice(0, 6).map((s, i) => (
                    <View key={s.storeId || s.storeName} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {s.storeName}
                      </Text>
                      <Text style={styles.legendValue}>{Math.round(s.share * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>

          <SectionTitle>Recent activity</SectionTitle>
          <Card style={styles.listCard}>
            {loading ? (
              <Loader />
            ) : recent.length === 0 ? (
              <EmptyState
                emoji="🧾"
                title={`Nothing recorded ${noun}`}
                body="Income and purchases you record appear here."
                actionLabel="Record income"
                onAction={() => router.push('/income-entry')}
              />
            ) : (
              recent.map((row, i) => (
                <View key={`${row.kind}-${row.id}`}>
                  {i > 0 && <View style={styles.rowDivider} />}
                  <ActivityRow
                    kind={row.kind}
                    title={row.title}
                    subtitle={row.subtitle}
                    amount={row.amount}
                    date={row.date}
                    onPress={() =>
                      router.push({
                        pathname: row.kind === 'income' ? '/income-entry' : '/purchase',
                        params: { id: row.id },
                      })
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

/** Money in / out figure inside the balance card. */
function Total({ label, value, arrow }: { label: string; value: number; arrow: string }) {
  return (
    <View style={styles.total}>
      <View style={styles.totalBadge}>
        <Text style={styles.totalArrow}>{arrow}</Text>
      </View>
      <View style={styles.totalText}>
        <Text style={styles.totalLabel}>{label}</Text>
        <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(value)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 140 },
  body: { paddingHorizontal: spacing(2), gap: spacing(1.5), marginTop: spacing(0.5) },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing(2.5),
    paddingTop: spacing(2.5),
    paddingBottom: spacing(2),
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  // Soft highlight in the corner of the card.
  heroGlow: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700' },
  heroValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: spacing(0.5),
  },
  totals: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(2),
    paddingTop: spacing(1.75),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  totalsDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing(1.5),
  },
  total: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  totalText: { flex: 1 },
  totalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalArrow: { fontSize: 16, fontWeight: '800', color: '#fff' },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 1 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  legend: { flex: 1, gap: spacing(1) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  legendLabel: { flex: 1, fontSize: 13, color: colors.text },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.muted },
  listCard: { paddingVertical: spacing(0.5) },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },
});
