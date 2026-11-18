import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalHeader, PhoneColumn } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type PickerOption = { id: string; label: string; hint?: string };

type Props = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  /** Placeholder for the search / new-entry field. */
  searchPlaceholder: string;
  /** Called with the typed name when nothing matches and the user taps create. */
  onCreate: (name: string) => Promise<void> | void;
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
};

/**
 * Full-screen list that doubles as a search box and a create form — typing a
 * name that doesn't exist yet offers to add it.
 */
export function PickerSheet({
  visible,
  title,
  options,
  selectedId,
  searchPlaceholder,
  onCreate,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = search.trim();
  const filtered = useMemo(() => {
    if (!trimmed) return options;
    const needle = trimmed.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, trimmed]);

  const exactMatch = options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
  const canCreate = trimmed.length > 0 && !exactMatch;

  function close() {
    setSearch('');
    setError(null);
    onClose();
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add it.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <PhoneColumn>
      <SafeAreaView style={styles.safe}>
        <ModalHeader title={title} onClose={close} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.muted}
              style={styles.search}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          {canCreate && (
            <Pressable
              onPress={create}
              disabled={busy}
              style={({ pressed }) => [styles.create, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.createText}>
                {busy ? 'Adding…' : `+ Add “${trimmed}”`}
              </Text>
            </Pressable>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(option) => option.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              trimmed ? (
                <View />
              ) : (
                <Text style={styles.empty}>
                  Nothing here yet — type a name above to add the first one.
                </Text>
              )
            }
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSearch('');
                    onSelect(item);
                  }}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {!!item.hint && <Text style={styles.rowHint}>{item.hint}</Text>}
                  </View>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
      </PhoneColumn>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing(2), paddingBottom: spacing(1) },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(1),
  },
  create: {
    marginHorizontal: spacing(2),
    marginBottom: spacing(1),
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
  },
  createText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  list: { paddingHorizontal: spacing(2), paddingBottom: spacing(4) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.75),
    marginBottom: spacing(0.75),
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, color: colors.text, fontWeight: '500' },
  rowHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  check: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: spacing(4),
    paddingHorizontal: spacing(3),
    lineHeight: 20,
  },
});
