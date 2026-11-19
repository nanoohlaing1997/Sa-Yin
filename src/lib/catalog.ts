import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from './firebase';

/** How items are bought. */
export const UNITS = ['ea', 'case'] as const;
export type Unit = (typeof UNITS)[number];

/** "ea" or "case"; anything else (older items) counts as "ea". */
export function toUnit(value: unknown): Unit {
  return value === 'case' ? 'case' : 'ea';
}

/** A place you buy from. `taxRate` is the last tax % used there. */
export type Store = { id: string; name: string; taxRate?: number };
export type Item = { id: string; name: string; unit: string };

function storeCollection(uid: string) {
  return collection(db, 'users', uid, 'stores');
}

function itemCollection(uid: string) {
  return collection(db, 'users', uid, 'items');
}

/** Lowercased name, used to keep "Costco" and "costco" from both existing. */
function key(name: string): string {
  return name.trim().toLowerCase();
}

type ListState<T> = { data: T[]; loading: boolean; error: string | null };

function useNamedCollection<T>(
  uid: string | null,
  path: 'stores' | 'items',
  map: (id: string, data: Record<string, unknown>) => T
): ListState<T> {
  const key = `${uid}:${path}`;
  const [snap, setSnap] = useState<{ key: string; data: T[]; error: string | null }>();

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, path), orderBy('nameKey'));
    return onSnapshot(
      q,
      (res) => setSnap({ key, data: res.docs.map((d) => map(d.id, d.data())), error: null }),
      (err) => setSnap({ key, data: [], error: err.message })
    );
    // `map` is a module-level function per caller; not a reactive dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, path, key]);

  if (!uid) return { data: [], loading: false, error: null };
  const current = snap?.key === key ? snap : undefined;
  return { data: current?.data ?? [], loading: !current, error: current?.error ?? null };
}

const toStore = (id: string, data: Record<string, unknown>): Store => ({
  id,
  name: typeof data.name === 'string' ? data.name : '',
  taxRate: typeof data.taxRate === 'number' ? data.taxRate : undefined,
});

const toItem = (id: string, data: Record<string, unknown>): Item => ({
  id,
  name: typeof data.name === 'string' ? data.name : '',
  unit: toUnit(data.unit),
});

export function useStores(uid: string | null): ListState<Store> {
  return useNamedCollection(uid, 'stores', toStore);
}

export function useItems(uid: string | null): ListState<Item> {
  return useNamedCollection(uid, 'items', toItem);
}

export async function createStore(uid: string, name: string): Promise<Store> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter a store name.');
  const ref = await addDoc(storeCollection(uid), {
    name: trimmed,
    nameKey: key(trimmed),
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: trimmed };
}

export async function renameStore(uid: string, id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter a store name.');
  await updateDoc(doc(db, 'users', uid, 'stores', id), {
    name: trimmed,
    nameKey: key(trimmed),
  });
}

export async function deleteStore(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'stores', id));
}

export async function createItem(uid: string, name: string, unit: string): Promise<Item> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter an item name.');
  const cleanUnit = unit.trim() || 'ea';
  const ref = await addDoc(itemCollection(uid), {
    name: trimmed,
    nameKey: key(trimmed),
    unit: cleanUnit,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: trimmed, unit: cleanUnit };
}

export async function updateItem(
  uid: string,
  id: string,
  name: string,
  unit: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter an item name.');
  await updateDoc(doc(db, 'users', uid, 'items', id), {
    name: trimmed,
    nameKey: key(trimmed),
    unit: unit.trim() || 'ea',
  });
}

export async function deleteItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'items', id));
}

/** True when `name` already exists in `list` (case-insensitive). */
export function nameTaken(list: { name: string }[], name: string, skipId?: string): boolean {
  const k = key(name);
  return list.some((entry) => key(entry.name) === k && (entry as Store).id !== skipId);
}

/** Remember the unit (ea / case) last used for an item in a purchase. */
export async function setItemUnit(uid: string, id: string, unit: Unit): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'items', id), { unit });
}

/** Remember the tax % used at a store so the next purchase there starts with it. */
export async function setStoreTaxRate(uid: string, id: string, taxRate: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'stores', id), { taxRate });
}
