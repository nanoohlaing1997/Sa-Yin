import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string | null };

export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...rest}
        style={[styles.input, !!error && styles.inputError, style]}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

/**
 * Centred pop-up for a problem the user needs to fix (e.g. a form that can't
 * be saved yet). Shown while `message` is set; OK or tapping outside clears it.
 */
export function ErrorPopup({
  message,
  title = 'Can’t save yet',
  onClose,
}: {
  message: string | null;
  title?: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!message} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.popupBackdrop} onPress={onClose} accessibilityLabel="Dismiss">
        {/* Inner Pressable keeps taps on the card from dismissing it. */}
        <Pressable style={styles.popupCard} onPress={() => undefined} accessibilityRole="alert">
          <View style={styles.popupIcon}>
            <Text style={styles.popupEmoji}>⚠️</Text>
          </View>
          <Text style={styles.popupTitle}>{title}</Text>
          <Text style={styles.popupMessage}>{message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.popupButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.popupButtonText}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function EmptyState({
  title,
  body,
  emoji,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      {!!emoji && (
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>{emoji}</Text>
        </View>
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {!!actionLabel && !!onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.emptyAction, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Header for full-screen forms: round close button, centred title. */
export function ModalHeader({
  title,
  onClose,
  closeLabel = 'Close',
  right,
}: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.modalHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <Text style={styles.modalTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.modalRight}>{right}</View>
    </View>
  );
}

/**
 * Keeps full-screen React Native <Modal> content inside the centred phone
 * column on web (a Modal renders at the window level, outside the app shell).
 */
export function PhoneColumn({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.phoneOuter}>
      <View style={styles.phoneInner}>{children}</View>
    </View>
  );
}

/** Bottom bar for a form's main action; stays put while the form scrolls. */
export function FormFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(2),
    ...shadow,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing(1),
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  buttonDanger: { backgroundColor: colors.danger },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: colors.primary },
  field: { marginBottom: spacing(2) },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing(0.75),
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: spacing(0.5) },
  banner: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: spacing(1.5),
    marginBottom: spacing(2),
  },
  bannerText: { color: colors.danger, fontSize: 14 },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,35,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing(3),
    alignItems: 'center',
    ...shadow,
  },
  popupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
  },
  popupEmoji: { fontSize: 26 },
  popupTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  popupMessage: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing(0.75),
  },
  popupButton: {
    alignSelf: 'stretch',
    marginTop: spacing(2.5),
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
  },
  popupButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: spacing(3), paddingHorizontal: spacing(2) },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.25),
  },
  emptyEmoji: { fontSize: 26 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing(0.5) },
  emptyBody: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  emptyAction: {
    marginTop: spacing(1.75),
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.25),
    paddingVertical: spacing(1.1),
  },
  emptyActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.25),
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: { fontSize: 15, color: colors.text, fontWeight: '700' },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalRight: { minWidth: 36, alignItems: 'flex-end' },
  phoneOuter: { flex: 1, alignItems: 'center', backgroundColor: '#E9E9EF' },
  phoneInner: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.bg },
  footer: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1.5),
    paddingBottom: spacing(2),
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing(1),
  },
  loader: { paddingVertical: spacing(5), alignItems: 'center' },
});
