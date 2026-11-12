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
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from './firebase';
import { TxType } from './categories';
import { endOfMonth, startOfMonth } from './format';

export type Transaction = {
  id: string;
  type: TxType;
  /** Always positive; `type` carries the direction. */
  amount: number;
  categoryId: string;
  note: string;
  date: Date;
};

export type TransactionInput = Omit<Transaction, 'id'>;

function txCollection(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

function toTransaction(id: string, data: Record<string, unknown>): Transaction {
  const raw = data.date;
  const date = raw instanceof Timestamp ? raw.toDate() : new Date();
  return {
    id,
    type: data.type === 'income' ? 'income' : 'expense',
    amount: typeof data.amount === 'number' ? Math.abs(data.amount) : 0,
    categoryId: typeof data.categoryId === 'string' ? data.categoryId : 'unknown',
    note: typeof data.note === 'string' ? data.note : '',
    date,
  };
}

export async function createTransaction(uid: string, input: TransactionInput): Promise<void> {
  await addDoc(txCollection(uid), {
    type: input.type,
    amount: Math.abs(input.amount),
    categoryId: input.categoryId,
    note: input.note.trim(),
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTransaction(
  uid: string,
  id: string,
  input: TransactionInput
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'transactions', id), {
    type: input.type,
    amount: Math.abs(input.amount),
    categoryId: input.categoryId,
    note: input.note.trim(),
    date: Timestamp.fromDate(input.date),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'transactions', id));
}

type TxState = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
};

/** Live transactions for the calendar month containing `month`. */
export function useMonthTransactions(uid: string | null, month: Date): TxState {
  const [state, setState] = useState<TxState>({
    transactions: [],
    loading: true,
    error: null,
  });

  // Depend on the month boundaries, not the Date identity, so re-renders
  // within the same month don't resubscribe.
  const from = startOfMonth(month).getTime();
  const to = endOfMonth(month).getTime();

  useEffect(() => {
    if (!uid) {
      setState({ transactions: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));

    const q = query(
      txCollection(uid),
      where('date', '>=', Timestamp.fromMillis(from)),
      where('date', '<=', Timestamp.fromMillis(to)),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setState({
          transactions: snap.docs.map((d) => toTransaction(d.id, d.data())),
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({ transactions: [], loading: false, error: err.message });
      }
    );

    return unsubscribe;
  }, [uid, from, to]);

  return state;
}

export type CategoryTotal = {
  categoryId: string;
  total: number;
  share: number;
};

export type MonthSummary = {
  income: number;
  expense: number;
  net: number;
  byCategory: CategoryTotal[];
};

export function summarise(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expense = 0;
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
    }
  }

  const byCategory: CategoryTotal[] = [...totals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      total,
      share: expense > 0 ? total / expense : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { income, expense, net: income - expense, byCategory };
}

export function useMonthSummary(transactions: Transaction[]): MonthSummary {
  return useMemo(() => summarise(transactions), [transactions]);
}

/** One-shot read, used by the editor modal when opened with an id. */
export async function getTransaction(uid: string, id: string): Promise<Transaction | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'transactions', id));
  return snap.exists() ? toTransaction(snap.id, snap.data()) : null;
}
