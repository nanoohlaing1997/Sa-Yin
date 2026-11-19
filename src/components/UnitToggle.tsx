import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Unit, UNITS } from '@/lib/catalog';
import { colors, radius } from '@/theme';

/** Compact "ea | case" switch. */
export function UnitToggle({ value, onChange }: { value: Unit; onChange: (unit: Unit) => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {UNITS.map((unit) => {
        const selected = unit === value;
        return (
          <Pressable
            key={unit}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={unit === 'ea' ? 'Each' : 'Case'}
            onPress={() => onChange(unit)}
            hitSlop={4}
            style={[styles.option, selected && styles.optionActive]}
          >
            <Text style={[styles.text, selected && styles.textActive]}>{unit}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  option: {
    minWidth: 52,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: colors.primary },
  text: { fontSize: 14, fontWeight: '700', color: colors.muted },
  textActive: { color: '#fff' },
});
