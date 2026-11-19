import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TabIcon } from '@/components/TabIcons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Card, ErrorPopup, SectionTitle } from '@/components/ui';
import { confirmAction } from '@/lib/dialog';
import { useAuth } from '@/lib/auth-context';
import { CsvExport, prepareIncomeCsv, preparePurchasesCsv, saveCsv } from '@/lib/export';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [preparing, setPreparing] = useState<'purchases' | 'income' | null>(null);
  const [ready, setReady] = useState<CsvExport | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function prepare(kind: 'purchases' | 'income') {
    if (!user || preparing) return;
    setPreparing(kind);
    try {
      setReady(
        kind === 'purchases' ? await preparePurchasesCsv(user.uid) : await prepareIncomeCsv(user.uid)
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Could not read your data.');
    } finally {
      setPreparing(null);
    }
  }

  function save() {
    if (!ready) return;
    const file = ready;
    // Called straight from the tap so iOS allows the share sheet.
    saveCsv(file)
      .then(() => setReady(null))
      .catch((e: unknown) =>
        setExportError(e instanceof Error ? e.message : 'Could not save the file.')
      );
  }

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

        <SectionTitle>Your data</SectionTitle>
        <Card style={styles.flush}>
          <LinkRow
            emoji="🛒"
            label="Export purchases"
            hint="Every item bought, as a spreadsheet (CSV)"
            busy={preparing === 'purchases'}
            onPress={() => prepare('purchases')}
          />
          <View style={styles.linkDivider} />
          <LinkRow
            emoji="💰"
            label="Export income"
            hint="Every franchise payment, as a spreadsheet (CSV)"
            busy={preparing === 'income'}
            onPress={() => prepare('income')}
          />
        </Card>
        <Text style={styles.note}>
          Keep a copy somewhere safe, like Files, Google Drive or email. Opens in Excel, Numbers
          or Google Sheets.
        </Text>

        <SectionTitle>Security</SectionTitle>
        <Card style={styles.flush}>
          <LinkRow
            emoji="🔒"
            label="Change password"
            hint="The password you unlock the app with"
            onPress={() => router.push('/change-password')}
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

        <View style={styles.signOut}>
          <Button
            title="Sign out"
            variant="secondary"
            onPress={() =>
              confirmAction(
                'Sign out?',
                'You’ll need your password to unlock the app again on this device.',
                'Sign out',
                signOut
              )
            }
          />
        </View>
      </ScrollView>

      <Modal visible={!!ready} transparent animationType="fade" onRequestClose={() => setReady(null)}>
        <Pressable style={styles.backdrop} onPress={() => setReady(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.readyIcon}>
              <Text style={styles.readyEmoji}>📄</Text>
            </View>
            <Text style={styles.readyTitle}>Your export is ready</Text>
            <Text style={styles.readyFile} numberOfLines={1}>
              {ready?.filename}
            </Text>
            <Text style={styles.readyBody}>
              {ready?.rows === 0
                ? 'There’s nothing recorded yet, so the file only has column headings.'
                : `${ready?.rows} ${ready?.rows === 1 ? 'row' : 'rows'}`}
            </Text>
            <View style={styles.readyActions}>
              <Button title="Save file" onPress={save} />
              <Button title="Cancel" variant="secondary" onPress={() => setReady(null)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ErrorPopup
        message={exportError}
        title="Export failed"
        onClose={() => setExportError(null)}
      />
    </View>
  );
}

function LinkRow({
  emoji,
  label,
  hint,
  onPress,
  busy = false,
}: {
  emoji: string;
  label: string;
  hint: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy }}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.bg }]}
    >
      <View style={styles.linkIcon}>
        <Text style={styles.linkEmoji}>{emoji}</Text>
      </View>
      <View style={styles.linkText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.linkHint}>{hint}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <TabIcon name="chevron-right" color={colors.muted} size={18} />
      )}
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
  signOut: { marginTop: spacing(1) },
  linkDivider: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  note: { fontSize: 13, color: colors.muted, lineHeight: 18, marginTop: -spacing(0.5) },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,35,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing(3),
    alignItems: 'center',
  },
  readyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
  },
  readyEmoji: { fontSize: 26 },
  readyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  readyFile: { fontSize: 13, color: colors.muted, marginTop: spacing(0.75) },
  readyBody: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: spacing(0.5) },
  readyActions: { alignSelf: 'stretch', gap: spacing(1), marginTop: spacing(2.5) },
});
