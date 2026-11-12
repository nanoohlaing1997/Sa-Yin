import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  function onSignOut() {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await signOut();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.displayName || 'Signed in'}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </Card>

        <SectionTitle>About</SectionTitle>
        <Card>
          <Row label="App" value="Sa Yin" />
          <View style={styles.divider} />
          <Row label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <Row label="Currency" value="USD" />
        </Card>

        <View style={styles.actions}>
          <Button title="Sign out" variant="secondary" onPress={onSignOut} loading={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2), gap: spacing(1.5) },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.primary },
  profileText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing(1.25),
  },
  rowLabel: { fontSize: 15, color: colors.text },
  rowValue: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  actions: { marginTop: spacing(2) },
});
