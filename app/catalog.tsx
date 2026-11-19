import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  ErrorPopup,
  Loader,
  ModalHeader,
} from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { useClose } from '@/lib/navigation';
import {
  createItem,
  createStore,
  deleteItem,
  deleteStore,
  Item,
  nameTaken,
  renameStore,
  Store,
  updateItem,
  useItems,
  useStores,
} from '@/lib/catalog';
import { confirmAction, promptText } from '@/lib/dialog';
import { colors, radius, spacing } from '@/theme';

type Tab = 'stores' | 'items';

export default function CatalogScreen() {
  const close = useClose();
  const [tab, setTab] = useState<Tab>('stores');

  return (
    <SafeAreaView style={styles.safe}>
      <ModalHeader title="Stores & items" onClose={() => close()} closeLabel="Done" />

      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {(['stores', 'items'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === option }}
              onPress={() => setTab(option)}
              style={[styles.segmentItem, tab === option && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, tab === option && styles.segmentTextActive]}>
                {option === 'stores' ? 'Stores' : 'Items'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {tab === 'stores' ? <StoresTab /> : <ItemsTab />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StoresTab() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { data, loading, error } = useStores(uid);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add() {
    // Enter on the keyboard bypasses the button's disabled/loading state.
    if (!uid || busy || !name.trim()) return;
    setFormError(null);
    if (nameTaken(data, name)) {
      setFormError('You already have a store with that name.');
      return;
    }
    setBusy(true);
    try {
      await createStore(uid, name);
      setName('');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not add it.');
    } finally {
      setBusy(false);
    }
  }

  function edit(store: Store) {
    promptText('Rename store', store.name, async (next) => {
        if (!uid || !next?.trim()) return;
        if (nameTaken(data, next, store.id)) {
          setFormError('You already have a store with that name.');
          return;
        }
        try {
          await renameStore(uid, store.id, next);
        } catch (e) {
          setFormError(e instanceof Error ? e.message : 'Could not rename it.');
        }
      });
  }

  function remove(store: Store) {
    if (!uid) return;
    confirmAction(
      `Delete ${store.name}?`,
      'Purchases already logged at this store keep their name.',
      'Delete',
      async () => {
        try {
          await deleteStore(uid, store.id);
        } catch (e) {
          setFormError(e instanceof Error ? e.message : 'Could not delete it.');
        }
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ErrorBanner message={error} />
      <ErrorPopup message={formError} title="Couldn’t do that" onClose={() => setFormError(null)} />

      <Card style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Store name — e.g. Restaurant Depot"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="words"
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Button title="Add store" onPress={add} loading={busy} disabled={!name.trim()} />
      </Card>

      {loading ? (
        <Loader />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            title="No stores yet"
            body="Add the places you buy from — Restaurant Depot, Costco, Aldi, NTFoods."
          />
        </Card>
      ) : (
        <Card>
          {data.map((store, i) => (
            <View key={store.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{store.name}</Text>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => edit(store)} hitSlop={8}>
                    <Text style={styles.action}>Rename</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(store)} hitSlop={8}>
                    <Text style={styles.destructive}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function ItemsTab() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { data, loading, error } = useItems(uid);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add() {
    // Enter on the keyboard bypasses the button's disabled/loading state.
    if (!uid || busy || !name.trim()) return;
    setFormError(null);
    if (nameTaken(data, name)) {
      setFormError('You already have an item with that name.');
      return;
    }
    setBusy(true);
    try {
      // ea / case is chosen per purchase; the item remembers the last one used.
      await createItem(uid, name, 'ea');
      setName('');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not add it.');
    } finally {
      setBusy(false);
    }
  }

  function rename(item: Item) {
    promptText('Rename item', item.name, async (next) => {
      if (!uid || !next.trim()) return;
      if (nameTaken(data, next, item.id)) {
        setFormError('You already have an item with that name.');
        return;
      }
      try {
        await updateItem(uid, item.id, next, item.unit);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Could not rename it.');
      }
    });
  }

  function remove(item: Item) {
    if (!uid) return;
    confirmAction(
      `Delete ${item.name}?`,
      'Purchases already logged keep this item’s name.',
      'Delete',
      async () => {
        try {
          await deleteItem(uid, item.id);
        } catch (e) {
          setFormError(e instanceof Error ? e.message : 'Could not delete it.');
        }
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ErrorBanner message={error} />
      <ErrorPopup message={formError} title="Couldn’t do that" onClose={() => setFormError(null)} />

      <Card style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Item name — e.g. Avocado"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Button title="Add item" onPress={add} loading={busy} disabled={!name.trim()} />
      </Card>

      {loading ? (
        <Loader />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            title="No items yet"
            body="Add what you buy — Avocado, Tuna Poke, Imitation crab, Containers."
          />
        </Card>
      ) : (
        <Card>
          {data.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.name}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => rename(item)} hitSlop={8}>
                    <Text style={styles.action}>Rename</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(item)} hitSlop={8}>
                    <Text style={styles.destructive}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  segmentWrap: { paddingHorizontal: spacing(2), paddingBottom: spacing(1.5) },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing(1.25),
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.text },
  content: { padding: spacing(2), paddingBottom: spacing(5), gap: spacing(1.5) },
  form: { gap: spacing(1.25) },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  divider: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    gap: spacing(1),
  },
  rowText: { flex: 1 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  rowActions: { flexDirection: 'row', gap: spacing(1.5) },
  action: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  destructive: { fontSize: 14, color: colors.danger, fontWeight: '600' },
});
