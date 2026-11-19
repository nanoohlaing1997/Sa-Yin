import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseAmount } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

/** Common sales-tax rates (US/California) plus Thai VAT. */
export const TAX_RATES = [0, 7, 7.25, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10, 10.25];

export function formatRate(rate: number): string {
  return `${Number(rate.toFixed(3))}%`;
}

type Props = {
  visible: boolean;
  value: number;
  onPick: (rate: number) => void;
  onClose: () => void;
};

/** Bottom sheet to choose the tax % for a purchase, with a custom option. */
export function TaxPicker({ visible, value, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  function applyCustom() {
    const rate = parseAmount(custom.replace('%', ''));
    if (!Number.isFinite(rate) || rate < 0 || rate > 30) {
      setError('Enter a rate between 0 and 30.');
      return;
    }
    setError(null);
    setCustom('');
    onPick(Math.round(rate * 1000) / 1000);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.column}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}>
            <View style={styles.grabber} />
            <Text style={styles.title}>Tax</Text>

            <ScrollView style={styles.list} contentContainerStyle={styles.grid}>
              {TAX_RATES.map((rate) => {
                const selected = rate === value;
                return (
                  <Pressable
                    key={rate}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onPick(rate)}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {rate === 0 ? 'No tax' : formatRate(rate)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.customLabel}>Other rate</Text>
            <View style={styles.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="e.g. 8.625"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                inputMode="decimal"
                onSubmitEditing={applyCustom}
                style={styles.customInput}
                accessibilityLabel="Custom tax rate"
              />
              <Text style={styles.percent}>%</Text>
              <Pressable
                accessibilityRole="button"
                onPress={applyCustom}
                disabled={!custom.trim()}
                style={[styles.apply, !custom.trim() && { opacity: 0.5 }]}
              >
                <Text style={styles.applyText}>Use</Text>
              </Pressable>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(20,10,35,0.45)',
  },
  // Keeps the sheet phone-width on desktop browsers.
  column: { width: '100%', maxWidth: 430 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing(1),
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(1.5),
  },
  list: { maxHeight: 260 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: spacing(1.4),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
  chipTextActive: { color: '#fff' },
  customLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginTop: spacing(2),
    marginBottom: spacing(0.75),
  },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  customInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
    fontSize: 16,
    color: colors.text,
  },
  percent: { fontSize: 16, fontWeight: '700', color: colors.muted },
  apply: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.25),
  },
  applyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing(0.75) },
});
