import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarModal } from '@/components/DatePickerField';
import { TabIcon } from '@/components/TabIcons';
import { PeriodMode, usePeriod } from '@/lib/period-context';
import { colors, radius, shadow, spacing } from '@/theme';

const MODES: { key: PeriodMode; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'cycle', label: '4 weeks' },
];

/**
 * Period switcher for the brand header: a Month / 4 weeks toggle, arrows to
 * step through periods, and the label opens a calendar to jump to a date.
 */
export function PeriodSwitcher() {
  const { mode, setMode, start, label, isCurrent, isLatest, next, prev, pickDate } = usePeriod();
  const [open, setOpen] = useState(false);
  const isMonth = mode === 'month';

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {MODES.map((m) => {
          const selected = m.key === mode;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(m.key)}
              style={[styles.toggleItem, selected && styles.toggleItemActive]}
            >
              <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <Arrow icon="chevron-left" hint={isMonth ? 'Previous month' : 'Previous 4 weeks'} onPress={prev} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${isMonth ? 'Pick a month' : 'Change start date'}`}
          onPress={() => setOpen(true)}
          hitSlop={6}
          style={({ pressed }) => [styles.center, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
          {!isMonth && (
            <Text style={styles.caption}>
              {isCurrent ? 'Current 4 weeks' : '4-week period'} · tap to change start
            </Text>
          )}
        </Pressable>
        <Arrow
          icon="chevron-right"
          hint={isMonth ? 'Next month' : 'Next 4 weeks'}
          onPress={next}
          disabled={isLatest}
        />
      </View>

      <CalendarModal
        visible={open}
        value={start}
        title={isMonth ? 'Jump to a month' : 'Start the 4-week period on'}
        onPick={(date) => {
          pickDate(date);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

function Arrow({
  icon,
  hint,
  onPress,
  disabled = false,
}: {
  icon: 'chevron-left' | 'chevron-right';
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
        disabled && { opacity: 0.3 },
      ]}
    >
      <TabIcon name={icon} color={colors.primary} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing(1.25) },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  toggleItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(0.85),
    borderRadius: radius.pill,
  },
  toggleItemActive: { backgroundColor: colors.card, ...shadow, shadowOpacity: 0.1 },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  toggleTextActive: { color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing(1) },
  label: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  caption: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 1 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
