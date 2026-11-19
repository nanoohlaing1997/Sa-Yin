import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
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

/** Money received from the franchise on one day. */
export type Income = {
  id: string;
  /** The calendar day of the payment, as a local Date at 12:00. */
  date: Date;
  amount: number;
  note: string;
};

export type IncomeInput = Omit<Income, 'id'>;

function incomeCollection(uid: string) {
  return collection(db, 'users', uid, 'income');
}

function toIncome(id: string, data: Record<string, unknown>): Income {
  return {
    id,
    date: readDay(data),
    amount: typeof data.amount === 'number' ? Math.abs(data.amount) : 0,
    note: typeof data.note === 'string' ? data.note : '',
  };
}

function serialise(input: IncomeInput) {
  return {
    ...dayFields(input.date),
    amount: Math.abs(input.amount),
    note: input.note.trim(),
  };
}

export async function createIncome(uid: string, input: IncomeInput): Promise<void> {
  await addDoc(incomeCollection(uid), {
    ...serialise(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateIncome(uid: string, id: string, input: IncomeInput): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'income', id), {
    ...serialise(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'income', id));
}

export async function getIncome(uid: string, id: string): Promise<Income | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'income', id));
  return snap.exists() ? toIncome(snap.id, snap.data()) : null;
}

type IncomeState = { income: Income[]; loading: boolean; error: string | null };

/** Live income dated between `start` and `end` (inclusive). */
export function useIncomeInRange(uid: string | null, start: Date, end: Date): IncomeState {
  const from = start.getTime();
  const to = end.getTime();
  const key = `${uid}:${from}:${to}`;
  // Tagged with the query key so a stale result is never shown for a new period.
  const [snap, setSnap] = useState<{ key: string; income: Income[]; error: string | null }>();

  useEffect(() => {
    if (!uid) return;
    const bounds = queryBounds(new Date(from), new Date(to));
    const q = query(
      incomeCollection(uid),
      where('date', '>=', bounds.from),
      where('date', '<=', bounds.to),
      orderBy('date', 'desc')
    );
    return onSnapshot(
      q,
      (res) =>
        setSnap({
          key,
          income: res.docs
            .map((d) => toIncome(d.id, d.data()))
            .filter((e) => inPeriod(e.date, new Date(from), new Date(to)))
            .sort((a, b) => b.date.getTime() - a.date.getTime()),
          error: null,
        }),
      (err) => setSnap({ key, income: [], error: err.message })
    );
  }, [uid, from, to, key]);

  if (!uid) return { income: [], loading: false, error: null };
  const current = snap?.key === key ? snap : undefined;
  return { income: current?.income ?? [], loading: !current, error: current?.error ?? null };
}

export type IncomeSummary = { total: number; count: number };

export function summariseIncome(income: Income[]): IncomeSummary {
  return { total: income.reduce((sum, e) => sum + e.amount, 0), count: income.length };
}

export function useIncomeSummary(income: Income[]): IncomeSummary {
  return useMemo(() => summariseIncome(income), [income]);
}

/** Days between franchise payments. */
export const PAYMENT_CYCLE_DAYS = 28;

/** The most recent franchise payment ever recorded, live. `undefined` while loading. */
export function useLatestIncome(uid: string | null): Income | null | undefined {
  const [snap, setSnap] = useState<{ uid: string; latest: Income | null }>();

  useEffect(() => {
    if (!uid) return;
    const q = query(incomeCollection(uid), orderBy('date', 'desc'), limit(1));
    return onSnapshot(
      q,
      (res) =>
        setSnap({
          uid,
          latest: res.empty ? null : toIncome(res.docs[0].id, res.docs[0].data()),
        }),
      () => setSnap({ uid, latest: null })
    );
  }, [uid]);

  if (!uid) return null;
  return snap?.uid === uid ? snap.latest : undefined;
}
