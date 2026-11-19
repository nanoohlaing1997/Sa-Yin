import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/TabIcons';
import { useClose } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

/** Bottom action sheet opened by the centre "+" button. */
export default function NewEntry() {
  const router = useRouter();
  const close = useClose();
  const insets = useSafeAreaInsets();

  function go(path: '/income-entry' | '/purchase') {
    // Replace so closing the form returns to the tab, not to this sheet.
    router.replace(path);
  }

  return (
    <View style={styles.root}>
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityLabel="Close"
        onPress={() => close()}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}>
        <View style={styles.grabber} />
        <Text style={styles.title}>What do you want to record?</Text>

        <Option
          emoji="💰"
          tint="#E3F6EE"
          title="Franchise income"
          body="Money you received from your franchise"
          onPress={() => go('/income-entry')}
        />
        <Option
          emoji="🛒"
          tint="#FCE7F2"
          title="Supplies purchase"
          body="What you bought, where, and how much"
          onPress={() => go('/purchase')}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => close()}
          style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Option({
  emoji,
  tint,
  title,
  body,
  onPress,
}: {
  emoji: string;
  tint: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.bg }]}
    >
      <View style={[styles.icon, { backgroundColor: tint }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionBody}>{body}</Text>
      </View>
      <TabIcon name="chevron-right" color={colors.muted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,10,35,0.45)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    gap: spacing(1),
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
    marginBottom: spacing(1),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.75),
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  text: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  optionBody: { fontSize: 13, color: colors.muted, marginTop: 2 },
  cancel: {
    marginTop: spacing(0.5),
    paddingVertical: spacing(1.75),
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
