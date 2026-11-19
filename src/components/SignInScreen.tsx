import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { authErrorMessage, OWNER_EMAIL, useAuth } from '@/lib/auth-context';
import { colors, radius, shadow, spacing } from '@/theme';

/** Password-only unlock screen; shown until this device has signed in once. */
export function SignInScreen() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(password);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.center}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Sa Yin</Text>
          <Text style={styles.subtitle}>Sushi bar ledger</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Account</Text>
            <Text style={styles.email} numberOfLines={1}>
              {OWNER_EMAIL || 'Owner email not set'}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              style={[styles.input, !!error && styles.inputError]}
              accessibilityLabel="Password"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button title="Unlock" onPress={submit} loading={busy} disabled={!password} />
          </View>
          <Text style={styles.hint}>You’ll stay signed in on this device.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: spacing(3) },
  logo: { width: 88, height: 88, borderRadius: 22, alignSelf: 'center' },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing(1.5),
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    ...shadow,
    padding: spacing(2.5),
    gap: spacing(1.25),
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  email: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: -spacing(0.75) },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing(2),
  },
});
