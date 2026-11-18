import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { TabIcon } from '@/components/TabIcons';
import { formatDate } from '@/lib/format';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = { value: Date; onChange: (next: Date) => void };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function shiftDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

type CalendarProps = {
  visible: boolean;
  value: Date;
  title?: string;
  onPick: (date: Date) => void;
  onClose: () => void;
};

/** Month-grid calendar in a centred card. Picking a day keeps `value`'s time of day. */
export function CalendarModal({ visible, value, title, onPick, onClose }: CalendarProps) {
  // First of the month being displayed; reset to `value`'s month each time it opens.
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [lastVisible, setLastVisible] = useState(visible);
  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) setView(new Date(value.getFullYear(), value.getMonth(), 1));
  }

  function pick(day: number) {
    const next = new Date(value);
    next.setFullYear(view.getFullYear(), view.getMonth(), day);
    onPick(next);
  }

  const today = new Date();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(view.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner Pressable swallows taps so the card doesn't close itself. */}
        <Pressable style={styles.card} onPress={() => undefined}>
          {!!title && <Text style={styles.calendarTitle}>{title}</Text>}
          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel="Previous month"
              hitSlop={8}
              onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              style={styles.monthArrow}
            >
              <TabIcon name="chevron-left" color={colors.primary} size={20} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              hitSlop={8}
              onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              style={styles.monthArrow}
            >
              <TabIcon name="chevron-right" color={colors.primary} size={20} />
            </Pressable>
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={i} style={styles.cell} />;
              const date = new Date(view.getFullYear(), view.getMonth(), day);
              const selected = sameDay(date, value);
              const isToday = sameDay(date, today);
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(date)}
                  accessibilityState={{ selected }}
                  onPress={() => pick(day)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.day,
                      isToday && !selected && styles.dayToday,
                      selected && styles.daySelected,
                    ]}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onPick(new Date())}
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Today</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.footerLink, { color: colors.muted }]}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Date row with prev/next-day arrows; tapping the date opens a month calendar. */
export function DatePickerField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          hitSlop={8}
          onPress={() => onChange(shiftDays(value, -1))}
          style={styles.arrow}
        >
          <TabIcon name="chevron-left" color={colors.primary} size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          onPress={() => setOpen(true)}
          style={styles.valueWrap}
        >
          <Text style={styles.calendarIcon}>📅</Text>
          <Text style={styles.value}>{formatDate(value)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next day"
          hitSlop={8}
          onPress={() => onChange(shiftDays(value, 1))}
          style={styles.arrow}
        >
          <TabIcon name="chevron-right" color={colors.primary} size={20} />
        </Pressable>
      </View>

      <CalendarModal
        visible={open}
        value={value}
        onPick={(next) => {
          onChange(next);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
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
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), padding: 4 },
  calendarIcon: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: '600', color: colors.text },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,35,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(2.5),
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing(2),
    ...shadow,
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(1.5),
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  week: { flexDirection: 'row', marginBottom: spacing(0.5) },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: '86%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 15, fontWeight: '600', color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(1.5),
    paddingHorizontal: spacing(0.5),
  },
  footerLink: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
