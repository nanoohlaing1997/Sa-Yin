import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addMonths, formatMonth, isSameMonth } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

type Props = {
  month: Date;
  onChange: (next: Date) => void;
};

export function MonthSwitcher({ month, onChange }: Props) {
  const atCurrentMonth = isSameMonth(month, new Date());

  return (
    <View style={styles.row}>
      <Arrow label="‹" hint="Previous month" onPress={() => onChange(addMonths(month, -1))} />
      <Text style={styles.label}>{formatMonth(month)}</Text>
      <Arrow
        label="›"
        hint="Next month"
        disabled={atCurrentMonth}
        onPress={() => onChange(addMonths(month, 1))}
      />
    </View>
  );
}

function Arrow({
  label,
  hint,
  onPress,
  disabled = false,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        pressed && !disabled && { opacity: 0.6 },
        disabled && { opacity: 0.25 },
      ]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(0.5),
  },
  label: { fontSize: 17, fontWeight: '700', color: colors.text },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 22, lineHeight: 26, color: colors.primary, fontWeight: '700' },
});
