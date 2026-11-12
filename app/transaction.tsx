import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorBanner, Field, Loader, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { categoriesFor, TxType } from '@/lib/categories';
import { formatDate } from '@/lib/format';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from '@/lib/transactions';
import { colors, radius, spacing } from '@/theme';

export default function TransactionModal() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categoriesFor('expense')[0].id);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date());

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;

    getTransaction(user.uid, id)
      .then((tx) => {
        if (cancelled) return;
        if (!tx) {
          setError('That transaction no longer exists.');
        } else {
          setType(tx.type);
          setAmount(String(tx.amount));
          setCategoryId(tx.categoryId);
          setNote(tx.note);
          setDate(tx.date);
        }
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
  }, [user, id]);

  function onChangeType(next: TxType) {
    setType(next);
    // Categories don't cross between income and expense.
    setCategoryId(categoriesFor(next)[0].id);
  }

  async function onSave() {
    if (!user) return;
    setError(null);

    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const input = { type, amount: parsed, categoryId, note, date };
      if (id) {
        await updateTransaction(user.uid, id, input);
      } else {
        await createTransaction(user.uid, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setSaving(false);
    }
  }

  function onDelete() {
    if (!user || !id) return;
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(user.uid, id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete.');
          }
        },
      },
    ]);
  }

  const categories = categoriesFor(type);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? 'Edit' : 'New'} transaction</Text>
        <View style={styles.headerSpacer} />
      </View>

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

            <View style={styles.segment}>
              {(['expense', 'income'] as const).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: type === option }}
                  onPress={() => onChangeType(option)}
                  style={[styles.segmentItem, type === option && styles.segmentItemActive]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      type === option && styles.segmentTextActive,
                    ]}
                  >
                    {option === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Field
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />

            <SectionTitle>Category</SectionTitle>
            <View style={styles.chips}>
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      styles.chip,
                      selected && {
                        backgroundColor: `${category.color}1A`,
                        borderColor: category.color,
                      },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{category.emoji}</Text>
                    <Text style={[styles.chipText, selected && { color: category.color }]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.spacer} />

            <Field
              label="Note"
              value={note}
              onChangeText={setNote}
              placeholder="Optional — what was it for?"
            />

            <SectionTitle>Date</SectionTitle>
            <View style={styles.dateRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous day"
                hitSlop={8}
                onPress={() => setDate(shiftDays(date, -1))}
                style={styles.dateArrow}
              >
                <Text style={styles.dateArrowText}>‹</Text>
              </Pressable>
              <Text style={styles.dateValue}>{formatDate(date)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next day"
                hitSlop={8}
                onPress={() => setDate(shiftDays(date, 1))}
                style={styles.dateArrow}
              >
                <Text style={styles.dateArrowText}>›</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setDate(new Date())} hitSlop={8}>
              <Text style={styles.today}>Set to today</Text>
            </Pressable>

            <View style={styles.actions}>
              <Button
                title={isEditing ? 'Save changes' : 'Add transaction'}
                onPress={onSave}
                loading={saving}
              />
              {isEditing && (
                <Button title="Delete" variant="danger" onPress={onDelete} />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function shiftDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
  },
  cancel: { color: colors.primary, fontSize: 16, width: 70 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerSpacer: { width: 70 },
  content: { padding: spacing(2), paddingBottom: spacing(5) },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing(2.5),
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing(1.25),
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.text },
  amountInput: { fontSize: 28, fontWeight: '700', paddingVertical: spacing(1.75) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.75),
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipEmoji: { fontSize: 15 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  spacer: { height: spacing(2.5) },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(1),
  },
  dateArrow: { width: 40, alignItems: 'center' },
  dateArrowText: { fontSize: 22, lineHeight: 26, color: colors.primary, fontWeight: '700' },
  dateValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  today: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing(1),
    alignSelf: 'flex-start',
  },
  actions: { marginTop: spacing(4), gap: spacing(1.5) },
});
