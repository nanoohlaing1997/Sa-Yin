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
  /** "ea" or "case" (older records may hold other units). */
  unit: string;
  qty: number;
  /** Price paid per unit. */
  unitPrice: number;
  /** unitPrice × qty, before tax. */
  amount: number;
};

/** A single supplies purchase: one date, one store, many lines. */
export type Purchase = {
  id: string;
  date: Date;
  storeId: string;
  storeName: string;
  lines: PurchaseLine[];
  /** Sum of line amounts, before tax. */
  subtotal: number;
  /** Tax rate as a percentage, e.g. 8.25. */
  taxRate: number;
  tax: number;
  /** subtotal + tax — what was actually paid. */
  total: number;
};

/** What the form provides; amounts and totals are computed on save. */
export type PurchaseInput = {
  date: Date;
  storeId: string;
  storeName: string;
  lines: { itemId: string; itemName: string; unit: string; qty: number; unitPrice: number }[];
  taxRate: number;
};

/** Round to cents. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Line amounts, subtotal, tax and total for a purchase. */
export function computeTotals(
  lines: { qty: number; unitPrice: number }[],
  taxRate: number
): { amounts: number[]; subtotal: number; tax: number; total: number } {
  const amounts = lines.map((l) => round2(l.unitPrice * l.qty));
  const subtotal = round2(amounts.reduce((sum, a) => sum + a, 0));
  const tax = round2((subtotal * taxRate) / 100);
  return { amounts, subtotal, tax, total: round2(subtotal + tax) };
}

function purchaseCollection(uid: string) {
  return collection(db, 'users', uid, 'purchases');
}

function toLine(raw: unknown): PurchaseLine {
  const data = (raw ?? {}) as Record<string, unknown>;
  const qty = typeof data.qty === 'number' ? data.qty : 0;
  const amount = typeof data.amount === 'number' ? data.amount : 0;
  return {
    itemId: typeof data.itemId === 'string' ? data.itemId : '',
    itemName: typeof data.itemName === 'string' ? data.itemName : 'Unknown item',
    unit: typeof data.unit === 'string' ? data.unit : 'ea',
    qty,
    // Older records only stored the line amount.
    unitPrice:
      typeof data.unitPrice === 'number' ? data.unitPrice : qty > 0 ? round2(amount / qty) : amount,
    amount,
  };
}

function toPurchase(id: string, data: Record<string, unknown>): Purchase {
  const lines = Array.isArray(data.lines) ? data.lines.map(toLine) : [];
  const subtotal =
    typeof data.subtotal === 'number'
      ? data.subtotal
      : round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0;
  const tax = typeof data.tax === 'number' ? data.tax : 0;
  return {
    id,
    date: readDay(data),
    storeId: typeof data.storeId === 'string' ? data.storeId : '',
    storeName: typeof data.storeName === 'string' ? data.storeName : 'Unknown store',
    lines,
    subtotal,
    taxRate,
    tax,
    total: typeof data.total === 'number' ? data.total : round2(subtotal + tax),
  };
}

function serialise(input: PurchaseInput) {
  const totals = computeTotals(input.lines, input.taxRate);
  return {
    ...dayFields(input.date),
    storeId: input.storeId,
    storeName: input.storeName,
    lines: input.lines.map((line, i) => ({
      itemId: line.itemId,
      itemName: line.itemName,
      unit: line.unit,
      qty: line.qty,
      unitPrice: round2(line.unitPrice),
      amount: totals.amounts[i],
    })),
    subtotal: totals.subtotal,
    taxRate: input.taxRate,
    tax: totals.tax,
    total: totals.total,
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
