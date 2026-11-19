import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DatePickerField } from '@/components/DatePickerField';
import { PickerSheet } from '@/components/PickerSheet';
import { TabIcon } from '@/components/TabIcons';
import {
  Button,
  Card,
  ErrorBanner,
  FormFooter,
  Loader,
  ModalHeader,
  SectionTitle,
} from '@/components/ui';
import { UnitToggle } from '@/components/UnitToggle';
import { useAuth } from '@/lib/auth-context';
import {
  createItem,
  createStore,
  Item,
  setItemUnit,
  toUnit,
  Unit,
  useItems,
  useStores,
} from '@/lib/catalog';
import { confirmAction } from '@/lib/dialog';
import { defaultEntryDate, formatMoney, formatPercent, parseAmount } from '@/lib/format';
import { usePeriod } from '@/lib/period-context';
import {
  computeTotals,
  createPurchase,
  deletePurchase,
  getPurchase,
  updatePurchase,
} from '@/lib/purchases';
import { colors, radius, spacing } from '@/theme';

/** A line being edited — price, qty and tax stay as text until save. */
type DraftLine = {
  key: string;
  itemId: string;
  itemName: string;
  unit: Unit;
  /** Price per unit, as typed. */
  price: string;
  qty: string;
  /** Tax %, typed by hand; empty means no tax. */
  tax: string;
};

let draftCounter = 0;
const newKey = () => `line-${draftCounter++}`;

function emptyLine(): DraftLine {
  return { key: newKey(), itemId: '', itemName: '', unit: 'ea', price: '', qty: '1', tax: '' };
}

/** Whole-number quantity from the typed text; 0 when empty or invalid. */
function qtyOf(line: DraftLine): number {
  const n = Math.floor(parseAmount(line.qty));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Price from the typed text; 0 when empty or invalid. */
function priceOf(line: DraftLine): number {
  const n = parseAmount(line.price);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Tax % from the typed text: 0 when empty, NaN when not a valid rate. */
function taxOf(line: DraftLine): number {
  const text = line.tax.replace('%', '').trim();
  if (!text) return 0;
  const n = parseAmount(text);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN;
}

export default function PurchaseModal() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const uid = user?.uid ?? null;
  const period = usePeriod();

  const stores = useStores(uid);
  const items = useItems(uid);

  const [date, setDate] = useState(() => defaultEntryDate(period.start, period.end));
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [itemPickerFor, setItemPickerFor] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !id) return;
    let cancelled = false;

    getPurchase(uid, id)
      .then((purchase) => {
        if (cancelled) return;
        if (!purchase) {
          setError('That purchase no longer exists.');
          return;
        }
        setDate(purchase.date);
        setStoreId(purchase.storeId);
        setStoreName(purchase.storeName);
        setLines(
          purchase.lines.map((line) => ({
            key: newKey(),
            itemId: line.itemId,
            itemName: line.itemName,
            unit: toUnit(line.unit),
            price: line.unitPrice.toFixed(2),
            qty: String(Math.max(1, Math.round(line.qty))),
            tax: line.taxRate ? String(line.taxRate) : '',
          }))
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load it.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, id]);

  const totals = computeTotals(
    lines.map((l) => ({ qty: qtyOf(l), unitPrice: priceOf(l), taxRate: taxOf(l) || 0 }))
  );
  const pricedCount = lines.filter((l) => priceOf(l) > 0).length;

  function patchLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function stepQty(line: DraftLine, delta: number) {
    patchLine(line.key, { qty: String(Math.max(1, (qtyOf(line) || 1) + delta)) });
  }

  function removeLine(key: string) {
    setLines((current) =>
      current.length === 1 ? [emptyLine()] : current.filter((line) => line.key !== key)
    );
  }

  function chooseItem(key: string, item: Item) {
    patchLine(key, { itemId: item.id, itemName: item.name, unit: toUnit(item.unit) });
    setItemPickerFor(null);
  }

  function chooseStore(nextId: string, name: string) {
    setStoreId(nextId);
    setStoreName(name);
    setStorePickerOpen(false);
  }

  async function onSave() {
    if (!uid || saving) return;
    setError(null);

    if (!storeId) {
      setError('Pick a store first.');
      return;
    }

    const filled = lines.filter((line) => line.itemId || line.price.trim());
    if (filled.length === 0) {
      setError('Add at least one item.');
      return;
    }

    const parsed = [];
    for (const line of filled) {
      if (!line.itemId) {
        setError('Every line needs an item — pick one or remove the line.');
        return;
      }
      const unitPrice = priceOf(line);
      if (unitPrice <= 0) {
        setError(`Enter the amount paid for ${line.itemName}.`);
        return;
      }
      const qty = qtyOf(line);
      if (qty <= 0) {
        setError(`Enter a quantity for ${line.itemName}.`);
        return;
      }
      const taxRate = taxOf(line);
      if (Number.isNaN(taxRate)) {
        setError(`Enter a tax % between 0 and 100 for ${line.itemName}, or leave it empty.`);
        return;
      }
      parsed.push({
        itemId: line.itemId,
        itemName: line.itemName,
        unit: line.unit,
        qty,
        unitPrice,
        taxRate,
      });
    }

    setSaving(true);
    try {
      const input = { date, storeId, storeName, lines: parsed };
      if (id) await updatePurchase(uid, id, input);
      else await createPurchase(uid, input);

      // Each item remembers the unit it was last bought in.
      for (const line of parsed) {
        const item = items.data.find((it) => it.id === line.itemId);
        if (item && toUnit(item.unit) !== line.unit) {
          setItemUnit(uid, item.id, line.unit).catch(() => undefined);
        }
      }

      // Make sure the saved entry is on screen when the form closes.
      period.showDate(date);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setSaving(false);
    }
  }

  function onDelete() {
    if (!uid || !id) return;
    confirmAction(
      'Delete this purchase?',
      'All its items go with it. This cannot be undone.',
      'Delete',
      async () => {
        try {
          await deletePurchase(uid, id);
          router.back();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not delete.');
        }
      }
    );
  }

  const activeLine = lines.find((line) => line.key === itemPickerFor);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ModalHeader
        title={isEditing ? 'Edit purchase' : 'Supplies purchase'}
        onClose={() => router.back()}
        right={
          isEditing ? (
            <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          ) : null
        }
      />

      {loading ? (
        <Loader />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ErrorBanner message={error} />

            <SectionTitle>Date</SectionTitle>
            <DatePickerField value={date} onChange={setDate} />

            <View style={styles.gap} />

            <SectionTitle>Store</SectionTitle>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStorePickerOpen(true)}
              style={({ pressed }) => [styles.select, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.selectText, !storeId && styles.placeholder]}>
                {storeName || 'Pick a store'}
              </Text>
              <TabIcon name="chevron-right" color={colors.muted} size={18} />
            </Pressable>

            <View style={styles.gap} />

            <SectionTitle>Items</SectionTitle>
            {lines.map((line, index) => {
              const qty = qtyOf(line);
              const price = priceOf(line);
              const taxRate = taxOf(line);
              return (
                <Card key={line.key} style={styles.lineCard}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineIndex}>Item {index + 1}</Text>
                    {lines.length > 1 && (
                      <Pressable
                        onPress={() => removeLine(line.key)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove item ${index + 1}`}
                      >
                        <Text style={styles.remove}>Remove</Text>
                      </Pressable>
                    )}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setItemPickerFor(line.key)}
                    style={({ pressed }) => [styles.select, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={[styles.selectText, !line.itemId && styles.placeholder]}>
                      {line.itemName || 'Pick an item'}
                    </Text>
                    <TabIcon name="chevron-right" color={colors.muted} size={18} />
                  </Pressable>

                  <View>
                    <Text style={styles.inputLabel}>Amount paid (per {line.unit})</Text>
                    <View style={styles.priceRow}>
                      <View style={styles.priceBox}>
                        <Text style={styles.currency}>$</Text>
                        <TextInput
                          value={line.price}
                          onChangeText={(value) => patchLine(line.key, { price: value })}
                          keyboardType="decimal-pad"
                          inputMode="decimal"
                          placeholder="0.00"
                          placeholderTextColor={colors.muted}
                          style={styles.priceInput}
                          accessibilityLabel={`Amount paid per ${line.unit}`}
                        />
                      </View>
                      <UnitToggle
                        value={line.unit}
                        onChange={(unit) => patchLine(line.key, { unit })}
                      />
                    </View>
                  </View>

                  <View style={styles.qtyRow}>
                    <Text style={styles.inputLabel}>Qty</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        onPress={() => stepQty(line, -1)}
                        disabled={qty <= 1}
                        hitSlop={6}
                        style={[styles.stepButton, qty <= 1 && { opacity: 0.35 }]}
                      >
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <TextInput
                        value={line.qty}
                        onChangeText={(value) =>
                          patchLine(line.key, { qty: value.replace(/[^0-9]/g, '') })
                        }
                        onBlur={() => {
                          if (!qtyOf(line)) patchLine(line.key, { qty: '1' });
                        }}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        style={styles.qtyInput}
                        accessibilityLabel="Quantity"
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        onPress={() => stepQty(line, 1)}
                        hitSlop={6}
                        style={styles.stepButton}
                      >
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.qtyRow}>
                    <Text style={styles.inputLabel}>Tax</Text>
                    <View style={[styles.taxBox, Number.isNaN(taxRate) && styles.taxBoxError]}>
                      <TextInput
                        value={line.tax}
                        onChangeText={(value) => patchLine(line.key, { tax: value })}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        style={styles.taxInput}
                        accessibilityLabel={`Tax percent for item ${index + 1}`}
                      />
                      <Text style={styles.taxPercent}>%</Text>
                    </View>
                  </View>

                  <View style={styles.review}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewCalc}>
                        {qty} {line.unit} × {formatMoney(price)}
                      </Text>
                      <Text style={styles.reviewValue}>{formatMoney(totals.amounts[index])}</Text>
                    </View>
                    {totals.taxes[index] > 0 && (
                      <View style={styles.reviewRow}>
                        <Text style={styles.reviewCalc}>Tax {formatPercent(taxRate)}</Text>
                        <Text style={styles.reviewValue}>+{formatMoney(totals.taxes[index])}</Text>
                      </View>
                    )}
                    <View style={[styles.reviewRow, styles.reviewTotalRow]}>
                      <Text style={styles.reviewTotalLabel}>Item total</Text>
                      <Text style={styles.reviewAmount}>
                        {formatMoney(totals.amounts[index] + totals.taxes[index])}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}

            <Pressable
              accessibilityRole="button"
              onPress={() => setLines((current) => [...current, emptyLine()])}
              style={({ pressed }) => [styles.addLine, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.addLineText}>+ Add another item</Text>
            </Pressable>

          </ScrollView>

          <FormFooter>
            <View style={styles.breakdown}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>
                  Subtotal · {pricedCount} {pricedCount === 1 ? 'item' : 'items'}
                </Text>
                <Text style={styles.sumValue}>{formatMoney(totals.subtotal)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Tax</Text>
                <Text style={styles.sumValue}>{formatMoney(totals.tax)}</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatMoney(totals.total)}</Text>
              </View>
            </View>
            <Button
              title={isEditing ? 'Save changes' : 'Save purchase'}
              onPress={onSave}
              loading={saving}
            />
          </FormFooter>
        </KeyboardAvoidingView>
      )}

      <PickerSheet
        visible={storePickerOpen}
        title="Store"
        searchPlaceholder="Search or type a new store"
        options={stores.data.map((store) => ({ id: store.id, label: store.name }))}
        selectedId={storeId}
        onCreate={async (name) => {
          if (!uid) return;
          const store = await createStore(uid, name);
          chooseStore(store.id, store.name);
        }}
        onSelect={(option) => chooseStore(option.id, option.label)}
        onClose={() => setStorePickerOpen(false)}
      />

      <PickerSheet
        visible={!!itemPickerFor}
        title="Item"
        searchPlaceholder="Search or type a new item"
        options={items.data.map((item) => ({ id: item.id, label: item.name }))}
        selectedId={activeLine?.itemId}
        onCreate={async (name) => {
          if (!uid || !itemPickerFor) return;
          // New items start as "ea"; the line's ea / case toggle changes it.
          const item = await createItem(uid, name, 'ea');
          chooseItem(itemPickerFor, item);
        }}
        onSelect={(option) => {
          if (!itemPickerFor) return;
          const item = items.data.find((entry) => entry.id === option.id);
          if (item) chooseItem(itemPickerFor, item);
        }}
        onClose={() => setItemPickerFor(null)}
      />

    </SafeAreaView>
  );
}

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  delete: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  content: { padding: spacing(2), paddingBottom: spacing(4) },
  gap: { height: spacing(2.5) },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.75),
    gap: spacing(1),
  },
  selectText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '600' },
  placeholder: { color: colors.muted, fontWeight: '400' },
  lineCard: { marginBottom: spacing(1.25), gap: spacing(1.5) },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineIndex: { fontSize: 13, fontWeight: '700', color: colors.muted },
  remove: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: spacing(0.75),
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.25) },
  priceBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
  },
  currency: { fontSize: 20, fontWeight: '800', color: colors.muted, marginRight: 4 },
  priceInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: spacing(1.25),
    ...webNoOutline,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, lineHeight: 24, fontWeight: '800', color: colors.primary },
  qtyInput: {
    width: 56,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: spacing(0.75),
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    ...webNoOutline,
  },
  review: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    gap: spacing(0.5),
  },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewCalc: { fontSize: 14, fontWeight: '600', color: colors.muted },
  reviewValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(214,23,127,0.18)',
    paddingTop: spacing(0.75),
    marginTop: spacing(0.25),
  },
  reviewTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  reviewAmount: { fontSize: 17, fontWeight: '800', color: colors.text },
  taxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(1.25),
  },
  taxBoxError: { borderColor: colors.danger },
  taxInput: {
    width: 64,
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: spacing(0.75),
    ...webNoOutline,
  },
  taxPercent: { fontSize: 16, fontWeight: '800', color: colors.muted, marginLeft: 4 },
  addLine: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
    marginBottom: spacing(2.5),
  },
  addLineText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  breakdown: { gap: spacing(0.5), paddingHorizontal: spacing(0.5) },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sumLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  sumValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  sumDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing(0.5) },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.text },
});
