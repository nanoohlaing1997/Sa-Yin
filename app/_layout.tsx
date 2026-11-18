import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SignInScreen } from '@/components/SignInScreen';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { PeriodProvider } from '@/lib/period-context';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <View style={styles.page}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <PeriodProvider>
              <RootNavigator />
            </PeriodProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}

function RootNavigator() {
  const { initialising, user } = useAuth();

  if (initialising) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return <SignInScreen />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="new"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="income-entry"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="purchase"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="catalog"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  // On web, render as a centred iPhone-sized column (iPhone 15 Pro Max width).
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#E9E9EF' : colors.bg,
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 40px rgba(0,0,0,0.12)', overflow: 'hidden' as const }
      : null),
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
});
