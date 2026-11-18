import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { colors, radius, shadow, spacing } from '@/theme';

const PALETTE = ['#D6177F', '#8E4EC6', '#2F6BFF', '#0E7C86', '#F2A93B', '#14A06B', '#E5484D'];

const ACTIONS = [
  { key: 'income', label: 'Income', emoji: '💰', tint: '#E3F6EE' },
  { key: 'supplies', label: 'Purchase', emoji: '🛒', tint: '#FCE7F2' },
  { key: 'manage', label: 'Stores & items', emoji: '📋', tint: '#EEE9FB' },
] as const;

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

  function onAction(key: (typeof ACTIONS)[number]['key']) {
    if (key === 'income') router.push('/income-entry');
    else if (key === 'supplies') router.push('/purchase');
    else router.push('/catalog');
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Sa Yin" subtitle="Sushi bar ledger">
          <PeriodSwitcher />
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>
              {net < 0 ? 'Loss' : 'Profit'} {noun}
            </Text>
            <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatSignedMoney(net)}
            </Text>
          </View>
          <View style={styles.totals}>
            <Total label="Money in" value={incomeSummary.total} arrow="↓" />
            <Total label="Supplies" value={purchaseSummary.total} arrow="↑" />
          </View>
        </ScreenHeader>

        <View style={styles.body}>
          <ErrorBanner message={error} />

          <NextPaymentCard />

          <View style={styles.actions}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.key}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                onPress={() => onAction(a.key)}
                style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.tint }]}>
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

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

/** Money in / out tile, drawn on the brand header. */
function Total({ label, value, arrow }: { label: string; value: number; arrow: string }) {
  return (
    <View style={styles.total}>
      <View style={styles.totalBadge}>
        <Text style={styles.totalArrow}>{arrow}</Text>
      </View>
      <View style={{ flex: 1 }}>
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
  balance: { alignItems: 'center', paddingTop: spacing(0.5) },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  balanceValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  body: { paddingHorizontal: spacing(2), gap: spacing(1.5), marginTop: spacing(2) },
  totals: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(0.5) },
  total: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.md,
    paddingVertical: spacing(1.25),
    paddingHorizontal: spacing(1.25),
  },
  totalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalArrow: { fontSize: 16, fontWeight: '800', color: '#fff' },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 1 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(1),
    ...shadow,
  },
  action: { flex: 1, alignItems: 'center', gap: spacing(0.75) },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: colors.text },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  legend: { flex: 1, gap: spacing(1) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  legendLabel: { flex: 1, fontSize: 13, color: colors.text },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.muted },
  listCard: { paddingVertical: spacing(0.5) },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },
});
