import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm. React Native's Alert.alert with buttons is a no-op on
 * web, so fall back to window.confirm there.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>
): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}

/** Cross-platform single-line text prompt (Alert.prompt is iOS-only). */
export function promptText(
  title: string,
  initial: string,
  onSubmit: (value: string) => void | Promise<void>
): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    const value = window.prompt(title, initial);
    if (value !== null) void onSubmit(value);
    return;
  }
  if (Platform.OS === 'ios') {
    Alert.prompt(
      title,
      undefined,
      (value) => void onSubmit(value ?? ''),
      'plain-text',
      initial
    );
    return;
  }
  // Android has no built-in text prompt.
  Alert.alert(title, 'Renaming isn’t available on Android yet. Delete and re-add it instead.');
}
