import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorBanner, Field } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/lib/auth-context';
import { colors, spacing } from '@/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      // Navigation is handled by the root auth guard.
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>Sa Yin</Text>
            <Text style={styles.tagline}>Know where your money goes.</Text>
          </View>

          <ErrorBanner message={error} />

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          <Button title="Sign in" onPress={onSubmit} loading={busy} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/sign-up" style={styles.link}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing(3), paddingTop: spacing(6), flexGrow: 1 },
  header: { marginBottom: spacing(4) },
  brand: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: colors.muted, marginTop: spacing(0.5) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing(3) },
  footerText: { color: colors.muted, fontSize: 15 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
