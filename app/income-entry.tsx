import { useLocalSearchParams } from 'expo-router';
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
import { useClose } from '@/lib/navigation';
import { fromDayString } from '@/lib/day';
import { confirmAction } from '@/lib/dialog';
import { defaultEntryDate, parseAmount } from '@/lib/format';
import { createIncome, deleteIncome, getIncome, updateIncome } from '@/lib/income';
import { usePeriod } from '@/lib/period-context';
import { colors, radius, spacing } from '@/theme';

export default function IncomeEntryModal() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const close = useClose();
  const period = usePeriod();
  const { id, day: dayParam } = useLocalSearchParams<{ id?: string; day?: string }>();
  const isEditing = !!id;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(
    () => fromDayString(dayParam) ?? defaultEntryDate(period.start, period.end)
  );

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !id) return;
    let cancelled = false;
    getIncome(uid, id)
      .then((entry) => {
        if (cancelled) return;
        if (!entry) {
          setError('That income record no longer exists.');
          return;
        }
        setAmount(String(entry.amount));
        setNote(entry.note);
        setDate(entry.date);
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

  async function onSave() {
    if (!uid || saving) return;
    setError(null);
    const parsed = parseAmount(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const input = { date, amount: Math.round(parsed * 100) / 100, note };
      if (id) await updateIncome(uid, id, input);
      else await createIncome(uid, input);
      // Make sure the saved entry is on screen when the form closes.
      period.showDate(date);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setSaving(false);
    }
  }

  function onDelete() {
    if (!uid || !id) return;
    confirmAction('Delete this income?', 'This cannot be undone.', 'Delete', async () => {
      try {
        await deleteIncome(uid, id);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
      }
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ModalHeader
        title={isEditing ? 'Edit income' : 'Franchise income'}
        onClose={() => close()}
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

            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Amount received</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9FD3BC"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  autoFocus={!isEditing}
                  onSubmitEditing={onSave}
                  // Size to the content so the currency sign hugs the number.
                  style={[styles.amountInput, { width: Math.max((amount || '0.00').length, 3) * 27 + 12 }]}
                  accessibilityLabel="Amount received"
                />
              </View>
            </View>

            <SectionTitle>Date</SectionTitle>
            <DatePickerField value={date} onChange={setDate} />

            <View style={styles.gap} />

            <SectionTitle>Note</SectionTitle>
            <Card style={styles.noteCard}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional — e.g. October payment"
                placeholderTextColor={colors.muted}
                style={styles.noteInput}
                returnKeyType="done"
                onSubmitEditing={onSave}
              />
            </Card>
          </ScrollView>

          <FormFooter>
            <Button
              title={isEditing ? 'Save changes' : 'Save income'}
              onPress={onSave}
              loading={saving}
            />
          </FormFooter>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing(2), paddingBottom: spacing(4) },
  delete: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  hero: {
    backgroundColor: '#E3F6EE',
    borderRadius: radius.xl,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(2),
    alignItems: 'center',
    marginBottom: spacing(2.5),
  },
  heroLabel: { fontSize: 13, fontWeight: '700', color: colors.income },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(0.5),
  },
  currency: { fontSize: 34, fontWeight: '800', color: colors.income, marginRight: 4 },
  amountInput: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.income,
    maxWidth: 280,
    textAlign: 'left',
    paddingVertical: 0,
    // Removes the browser focus outline on web.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  gap: { height: spacing(2.5) },
  noteCard: { paddingVertical: 0, paddingHorizontal: 0 },
  noteInput: {
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.75),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
