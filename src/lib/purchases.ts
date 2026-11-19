import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { dayFields, inPeriod, queryBounds, readDay } from './day';
import { db } from './firebase';

/**
 * One line of a receipt. Item name and unit are copied in at save time so a
 * past purchase still reads correctly after the item is renamed or deleted.
 */
export type PurchaseLine = {
  itemId: string;
  itemName: string;
  unit: string;
  qty: number;
  amount: number;
};

/** A single supplies purchase: one date, one store, many lines. */
export type Purchase = {
  id: string;
  date: Date;
  storeId: string;
  storeName: string;
  lines: PurchaseLine[];
  total: number;
};

export type PurchaseInput = Omit<Purchase, 'id' | 'total'>;

function purchaseCollection(uid: string) {
  return collection(db, 'users', uid, 'purchases');
}

export function lineTotal(lines: PurchaseLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

function toLine(raw: unknown): PurchaseLine {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    itemId: typeof data.itemId === 'string' ? data.itemId : '',
    itemName: typeof data.itemName === 'string' ? data.itemName : 'Unknown item',
    unit: typeof data.unit === 'string' ? data.unit : 'ea',
    qty: typeof data.qty === 'number' ? data.qty : 0,
    amount: typeof data.amount === 'number' ? data.amount : 0,
  };
}

function toPurchase(id: string, data: Record<string, unknown>): Purchase {
  const lines = Array.isArray(data.lines) ? data.lines.map(toLine) : [];
  return {
    id,
    date: readDay(data),
    storeId: typeof data.storeId === 'string' ? data.storeId : '',
    storeName: typeof data.storeName === 'string' ? data.storeName : 'Unknown store',
    lines,
    total: typeof data.total === 'number' ? data.total : lineTotal(lines),
  };
}

function serialise(input: PurchaseInput) {
  return {
    ...dayFields(input.date),
    storeId: input.storeId,
    storeName: input.storeName,
    lines: input.lines.map((line) => ({
      itemId: line.itemId,
      itemName: line.itemName,
      unit: line.unit,
      qty: line.qty,
      amount: line.amount,
    })),
    total: lineTotal(input.lines),
  };
}

export async function createPurchase(uid: string, input: PurchaseInput): Promise<void> {
  await addDoc(purchaseCollection(uid), {
    ...serialise(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePurchase(
  uid: string,
  id: string,
  input: PurchaseInput
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'purchases', id), {
    ...serialise(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePurchase(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'purchases', id));
}

export async function getPurchase(uid: string, id: string): Promise<Purchase | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'purchases', id));
  return snap.exists() ? toPurchase(snap.id, snap.data()) : null;
}

type PurchaseState = {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
};

/** Live purchases dated between `start` and `end` (inclusive). */
export function usePurchasesInRange(uid: string | null, start: Date, end: Date): PurchaseState {
  const from = start.getTime();
  const to = end.getTime();
  const key = `${uid}:${from}:${to}`;
  // Tagged with the query key so a stale result is never shown for a new period.
  const [snap, setSnap] = useState<{
    key: string;
    purchases: Purchase[];
    error: string | null;
  }>();

  useEffect(() => {
    if (!uid) return;
    const bounds = queryBounds(new Date(from), new Date(to));
    const q = query(
      purchaseCollection(uid),
      where('date', '>=', bounds.from),
      where('date', '<=', bounds.to),
      orderBy('date', 'desc')
    );
    return onSnapshot(
      q,
      (res) =>
        setSnap({
          key,
          purchases: res.docs
            .map((d) => toPurchase(d.id, d.data()))
            .filter((p) => inPeriod(p.date, new Date(from), new Date(to)))
            .sort((a, b) => b.date.getTime() - a.date.getTime()),
          error: null,
        }),
      (err) => setSnap({ key, purchases: [], error: err.message })
    );
  }, [uid, from, to, key]);

  if (!uid) return { purchases: [], loading: false, error: null };
  const current = snap?.key === key ? snap : undefined;
  return {
    purchases: current?.purchases ?? [],
    loading: !current,
    error: current?.error ?? null,
  };
}

export type ItemTotal = {
  itemId: string;
  itemName: string;
  unit: string;
  qty: number;
  total: number;
  share: number;
};

export type StoreTotal = {
  storeId: string;
  storeName: string;
  trips: number;
  total: number;
  share: number;
};

export type PurchaseSummary = {
  total: number;
  trips: number;
  byItem: ItemTotal[];
  byStore: StoreTotal[];
};

export function summarisePurchases(purchases: Purchase[]): PurchaseSummary {
  let total = 0;
  const items = new Map<string, ItemTotal>();
  const stores = new Map<string, StoreTotal>();

  for (const purchase of purchases) {
    total += purchase.total;

    const storeKey = purchase.storeId || purchase.storeName;
    const store = stores.get(storeKey) ?? {
      storeId: purchase.storeId,
      storeName: purchase.storeName,
      trips: 0,
      total: 0,
      share: 0,
    };
    store.trips += 1;
    store.total += purchase.total;
    stores.set(storeKey, store);

    for (const line of purchase.lines) {
      const itemKey = line.itemId || line.itemName;
      const item = items.get(itemKey) ?? {
        itemId: line.itemId,
        itemName: line.itemName,
        unit: line.unit,
        qty: 0,
        total: 0,
        share: 0,
      };
      item.qty += line.qty;
      item.total += line.amount;
      items.set(itemKey, item);
    }
  }

  const withShare = <T extends { total: number; share: number }>(list: T[]): T[] =>
    list
      .map((entry) => ({ ...entry, share: total > 0 ? entry.total / total : 0 }))
      .sort((a, b) => b.total - a.total);

  return {
    total,
    trips: purchases.length,
    byItem: withShare([...items.values()]),
    byStore: withShare([...stores.values()]),
  };
}

export function usePurchaseSummary(purchases: Purchase[]): PurchaseSummary {
  return useMemo(() => summarisePurchases(purchases), [purchases]);
}

/** Average price per unit, or null when quantities weren't recorded. */
export function unitPrice(line: PurchaseLine): number | null {
  return line.qty > 0 ? line.amount / line.qty : null;
}
