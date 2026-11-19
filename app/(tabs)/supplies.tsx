import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { formatRate } from '@/components/TaxPicker';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { Card, EmptyState, ErrorBanner, Loader, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatMoney } from '@/lib/format';
import { usePeriod } from '@/lib/period-context';
import { Purchase, usePurchasesInRange, usePurchaseSummary } from '@/lib/purchases';
import { colors, radius, spacing } from '@/theme';

export default function SushiScreen() {
  const { user } = useAuth();
  const { start, end, noun } = usePeriod();
  const router = useRouter();
  const { purchases, loading, error } = usePurchasesInRange(user?.uid ?? null, start, end);
  const summary = usePurchaseSummary(purchases);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Supplies"
          subtitle="Money out"
         
          right={
            <Pressable onPress={() => router.push('/catalog')} hitSlop={8} style={styles.manageBtn}>
              <Text style={styles.manage}>Stores & items</Text>
            </Pressable>
          }
        >
          <PeriodSwitcher />
        </ScreenHeader>

        <View style={styles.body}>
        <ErrorBanner message={error} />

        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Spent {noun}</Text>
          <Text style={styles.totalValue}>{formatMoney(summary.total)}</Text>
          <Text style={styles.totalMeta}>
            {summary.trips} {summary.trips === 1 ? 'purchase' : 'purchases'} ·{' '}
            {summary.byItem.length} {summary.byItem.length === 1 ? 'item' : 'items'}
          </Text>
        </Card>

        {summary.byStore.length > 0 && (
          <>
            <SectionTitle>By store</SectionTitle>
            <Card>
              {summary.byStore.map((store, i) => (
                <View key={store.storeId || store.storeName}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.statRow}>
                    <View style={styles.statText}>
                      <Text style={styles.statLabel}>{store.storeName}</Text>
                      <Text style={styles.statHint}>
                        {store.trips} {store.trips === 1 ? 'purchase' : 'purchases'}
                      </Text>
                    </View>
                    <View style={styles.statValues}>
                      <Text style={styles.statValue}>{formatMoney(store.total)}</Text>
                      <Text style={styles.statShare}>{Math.round(store.share * 100)}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {summary.byItem.length > 0 && (
          <>
            <SectionTitle>Top items</SectionTitle>
            <Card>
              {summary.byItem.slice(0, 8).map((item, i) => (
                <View key={item.itemId || item.itemName}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.statRow}>
                    <View style={styles.statText}>
                      <Text style={styles.statLabel}>{item.itemName}</Text>
                      <Text style={styles.statHint}>
                        {trimNumber(item.qty)} {item.unit}
                        {item.qty > 0 && ` · ${formatMoney(item.total / item.qty)}/${item.unit}`}
                      </Text>
                    </View>
                    <View style={styles.statValues}>
                      <Text style={styles.statValue}>{formatMoney(item.total)}</Text>
                      <Text style={styles.statShare}>{Math.round(item.share * 100)}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionTitle>Purchases</SectionTitle>
        {loading ? (
          <Loader />
        ) : purchases.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🛒"
              title={`No purchases ${noun}`}
              body="Record what you bought, where, and how much."
              actionLabel="Record a purchase"
              onAction={() => router.push('/purchase')}
            />
          </Card>
        ) : (
          purchases.map((purchase) => (
            <TripCard
              key={purchase.id}
              purchase={purchase}
              onPress={() =>
                router.push({ pathname: '/purchase', params: { id: purchase.id } })
              }
            />
          ))
        )}
        </View>
      </ScrollView>

    </View>
  );
}

function TripCard({ purchase, onPress }: { purchase: Purchase; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.trip}>
        <View style={styles.tripHeader}>
          <View style={styles.statText}>
            <Text style={styles.tripStore}>{purchase.storeName}</Text>
            <Text style={styles.statHint}>{formatDate(purchase.date)}</Text>
          </View>
          <Text style={styles.tripTotal}>{formatMoney(purchase.total)}</Text>
        </View>
        <View style={styles.divider} />
        {purchase.lines.map((line, i) => (
          <View key={`${line.itemId}-${i}`} style={styles.lineRow}>
            <Text style={styles.lineName} numberOfLines={1}>
              {line.itemName}
            </Text>
            <Text style={styles.lineQty}>
              {trimNumber(line.qty)} {line.unit}
            </Text>
            <Text style={styles.lineAmount}>{formatMoney(line.amount)}</Text>
          </View>
        ))}
        {purchase.tax > 0 && (
          <View style={styles.lineRow}>
            <Text style={[styles.lineName, styles.taxText]}>Tax</Text>
            <Text style={styles.lineQty}>{formatRate(purchase.taxRate)}</Text>
            <Text style={[styles.lineAmount, styles.taxText]}>{formatMoney(purchase.tax)}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

/** 1 instead of 1.0, but keeps 2.5. */
function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 150 },
  body: { paddingHorizontal: spacing(2), gap: spacing(1.5), marginTop: spacing(2) },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radius.pill,
  },
  manage: { color: '#fff', fontSize: 14, fontWeight: '700' },
  totalCard: { alignItems: 'center', paddingVertical: spacing(2.5) },
  totalLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  totalValue: { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: spacing(0.5) },
  totalMeta: { fontSize: 13, color: colors.muted, marginTop: spacing(0.5) },
  divider: { height: 1, backgroundColor: colors.border },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.25),
    gap: spacing(1),
  },
  statText: { flex: 1 },
  statLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  statHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  statValues: { alignItems: 'flex-end' },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  statShare: { fontSize: 12, color: colors.muted, marginTop: 2 },
  trip: { gap: spacing(0.5) },
  tripHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing(1) },
  tripStore: { fontSize: 16, fontWeight: '700', color: colors.text },
  tripTotal: { fontSize: 17, fontWeight: '800', color: colors.text },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing(1),
    gap: spacing(1),
  },
  taxText: { color: colors.muted },
  lineName: { flex: 1, fontSize: 14, color: colors.text },
  lineQty: { fontSize: 13, color: colors.muted, minWidth: 64, textAlign: 'right' },
  lineAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 72,
    textAlign: 'right',
  },
});
