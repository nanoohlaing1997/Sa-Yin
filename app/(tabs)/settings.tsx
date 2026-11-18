import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabIcon } from '@/components/TabIcons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Settings" subtitle="Sa Yin" />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Your lists</SectionTitle>
        <Card style={styles.flush}>
          <LinkRow
            emoji="📋"
            label="Stores & items"
            hint="Where you buy and what you buy"
            onPress={() => router.push('/catalog')}
          />
        </Card>

        <SectionTitle>About</SectionTitle>
        <Card>
          <Row label="App" value="Sa Yin" />
          <View style={styles.divider} />
          <Row label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <Row label="Currency" value="USD" />
          <View style={styles.divider} />
          <Row label="Account" value={user?.email ?? '—'} />
        </Card>
      </ScrollView>
    </View>
  );
}

function LinkRow({
  emoji,
  label,
  hint,
  onPress,
}: {
  emoji: string;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.bg }]}
    >
      <View style={styles.linkIcon}>
        <Text style={styles.linkEmoji}>{emoji}</Text>
      </View>
      <View style={styles.linkText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.linkHint}>{hint}</Text>
      </View>
      <TabIcon name="chevron-right" color={colors.muted} size={18} />
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2), gap: spacing(1.5), paddingBottom: 140 },
  flush: { padding: 0, overflow: 'hidden' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    padding: spacing(2),
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEE9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkEmoji: { fontSize: 20 },
  linkText: { flex: 1 },
  linkHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(2),
    paddingVertical: spacing(1.25),
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  rowValue: { flexShrink: 1, fontSize: 15, color: colors.muted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
});
