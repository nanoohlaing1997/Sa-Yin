import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorBanner, Field, FormFooter, ModalHeader } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/lib/auth-context';
import { useClose } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

const MIN_LENGTH = 8;

export default function ChangePasswordModal() {
  const close = useClose();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSave() {
    if (busy) return;
    setError(null);
    if (next.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters for the new password.`);
      return;
    }
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    if (next === current) {
      setError('The new password must be different from the current one.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Your current password isn’t right.'
          : authErrorMessage(e)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ModalHeader title="Change password" onClose={() => close()} />

      {done ? (
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Text style={styles.doneEmoji}>✅</Text>
          </View>
          <Text style={styles.doneTitle}>Password changed</Text>
          <Text style={styles.doneBody}>
            Use your new password next time you unlock Sa Yin on a device.
          </Text>
          <View style={styles.doneButton}>
            <Button title="Done" onPress={() => close()} />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ErrorBanner message={error} />
            <Field
              label="Current password"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              autoFocus
            />
            <Field
              label={`New password (at least ${MIN_LENGTH} characters)`}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Field
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={onSave}
              returnKeyType="done"
            />
          </ScrollView>
          <FormFooter>
            <Button
              title="Change password"
              onPress={onSave}
              loading={busy}
              disabled={!current || !next || !confirm}
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
  content: { padding: spacing(2) },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(3) },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E3F6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
  },
  doneEmoji: { fontSize: 32 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  doneBody: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing(1),
    lineHeight: 21,
  },
  doneButton: { alignSelf: 'stretch', marginTop: spacing(3), borderRadius: radius.md },
});
