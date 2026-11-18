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

import { TabIcon } from '@/components/TabIcons';
import { DatePickerField } from '@/components/DatePickerField';
import { PickerSheet } from '@/components/PickerSheet';
import {
  Button,
  Card,
  ErrorBanner,
  FormFooter,
  Loader,
  ModalHeader,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { confirmAction } from '@/lib/dialog';
import { createItem, createStore, Item, useItems, useStores } from '@/lib/catalog';
import { defaultEntryDate, formatMoney, parseAmount } from '@/lib/format';
import { usePeriod } from '@/lib/period-context';
import {
  createPurchase,
  deletePurchase,
  getPurchase,
  PurchaseLine,
  updatePurchase,
} from '@/lib/purchases';
import { colors, radius, spacing } from '@/theme';

/** A line being edited — amount and qty stay as text until save. */
type DraftLine = {
  key: string;
  itemId: string;
  itemName: string;
  unit: string;
  qty: string;
  amount: string;
};

let draftCounter = 0;
const newKey = () => `line-${draftCounter++}`;

function emptyLine(): DraftLine {
  return { key: newKey(), itemId: '', itemName: '', unit: '', qty: '1', amount: '' };
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
            unit: line.unit,
            qty: String(line.qty),
            amount: line.amount.toFixed(2),
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

  // Running total, ignoring lines that aren't filled in yet.
  const runningTotal = lines.reduce((sum, line) => {
    const value = parseAmount(line.amount);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  function patchLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function removeLine(key: string) {
    setLines((current) =>
      current.length === 1 ? [emptyLine()] : current.filter((line) => line.key !== key)
    );
  }

  function chooseItem(key: string, item: Item) {
    patchLine(key, { itemId: item.id, itemName: item.name, unit: item.unit });
    setItemPickerFor(null);
  }

  async function onSave() {
    if (!uid || saving) return;
    setError(null);

    if (!storeId) {
      setError('Pick a store first.');
      return;
    }

    const filled = lines.filter((line) => line.itemId || line.amount.trim());
    if (filled.length === 0) {
      setError('Add at least one item.');
      return;
    }

    const parsed: PurchaseLine[] = [];
    for (const line of filled) {
      if (!line.itemId) {
        setError('Every line needs an item — pick one or remove the line.');
        return;
      }
      const amount = Math.round(parseAmount(line.amount) * 100) / 100;
      if (!Number.isFinite(amount) || amount <= 0) {
        setError(`Enter an amount for ${line.itemName}.`);
        return;
      }
      const qty = parseAmount(line.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        setError(`Enter a quantity for ${line.itemName}.`);
        return;
      }
      parsed.push({
        itemId: line.itemId,
        itemName: line.itemName,
        unit: line.unit,
        qty,
        amount,
      });
    }

    setSaving(true);
    try {
      const input = { date, storeId, storeName, lines: parsed };
      if (id) {
        await updatePurchase(uid, id, input);
      } else {
        await createPurchase(uid, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setSaving(false);
    }
  }

  function onDelete() {
    if (!uid || !id) return;
    confirmAction('Delete this purchase?', 'All its items go with it. This cannot be undone.', 'Delete', async () => {
      try {
        await deletePurchase(uid, id);
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
      }
    });
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
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
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
            {lines.map((line, index) => (
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

                <View style={styles.inputRow}>
                  <View style={styles.qtyWrap}>
                    <Text style={styles.inputLabel}>
                      Qty{line.unit ? ` (${line.unit})` : ''}
                    </Text>
                    <TextInput
                      value={line.qty}
                      onChangeText={(value) => patchLine(line.key, { qty: value })}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.amountWrap}>
                    <Text style={styles.inputLabel}>Amount paid</Text>
                    <TextInput
                      value={line.amount}
                      onChangeText={(value) => patchLine(line.key, { amount: value })}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                    />
                  </View>
                </View>

                {unitPriceHint(line)}
              </Card>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => setLines((current) => [...current, emptyLine()])}
              style={({ pressed }) => [styles.addLine, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.addLineText}>+ Add another item</Text>
            </Pressable>

          </ScrollView>

          <FormFooter>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMoney(runningTotal)}</Text>
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
          setStoreId(store.id);
          setStoreName(store.name);
          setStorePickerOpen(false);
        }}
        onSelect={(option) => {
          setStoreId(option.id);
          setStoreName(option.label);
          setStorePickerOpen(false);
        }}
        onClose={() => setStorePickerOpen(false)}
      />

      <PickerSheet
        visible={!!itemPickerFor}
        title="Item"
        searchPlaceholder="Search or type a new item"
        options={items.data.map((item) => ({
          id: item.id,
          label: item.name,
          hint: `per ${item.unit}`,
        }))}
        selectedId={activeLine?.itemId}
        onCreate={async (name) => {
          if (!uid || !itemPickerFor) return;
          // New items default to "ea"; change the unit under Manage → Items.
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

function unitPriceHint(line: DraftLine) {
  const amount = parseAmount(line.amount);
  const qty = parseAmount(line.qty);
  if (!line.itemId || !Number.isFinite(amount) || !Number.isFinite(qty) || qty <= 0 || amount <= 0) {
    return null;
  }
  return (
    <Text style={styles.unitPrice}>
      {formatMoney(amount / qty)} per {line.unit || 'ea'}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  delete: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  content: { padding: spacing(2), paddingBottom: spacing(5) },
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
  },
  selectText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  placeholder: { color: colors.muted, fontWeight: '400' },
  lineCard: { marginBottom: spacing(1.25), gap: spacing(1.25) },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineIndex: { fontSize: 13, fontWeight: '700', color: colors.muted },
  remove: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing(1.25) },
  qtyWrap: { flex: 1 },
  amountWrap: { flex: 1.4 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing(0.5),
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(1.25),
    paddingVertical: spacing(1.25),
    fontSize: 16,
    color: colors.text,
  },
  unitPrice: { fontSize: 13, color: colors.muted },
  addLine: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  addLineText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(0.5),
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.muted },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.text },
});
