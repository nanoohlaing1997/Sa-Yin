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

export default function SignUp() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await signUp(name, email, password);
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
            <Text style={styles.brand}>Create account</Text>
            <Text style={styles.tagline}>Start tracking in under a minute.</Text>
          </View>

          <ErrorBanner message={error} />

          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Nano"
            autoCapitalize="words"
            textContentType="name"
          />
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
            placeholder="At least 6 characters"
            secureTextEntry
            textContentType="newPassword"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          <Button title="Create account" onPress={onSubmit} loading={busy} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/sign-in" style={styles.link}>
              Sign in
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
  brand: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: colors.muted, marginTop: spacing(0.5) },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing(3) },
  footerText: { color: colors.muted, fontSize: 15 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
