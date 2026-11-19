import { Platform, Share } from 'react-native';

import { toDayString } from './day';
import { listAllIncome } from './income';
import { listAllPurchases } from './purchases';

type Cell = string | number;

/** RFC 4180 CSV. Numbers are written plainly so spreadsheets can sum them. */
function toCsv(header: string[], rows: Cell[][]): string {
  const cell = (value: Cell) => {
    const text = typeof value === 'number' ? String(value) : value;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** Cents as a plain decimal, e.g. 12.5 → "12.50". */
const money = (n: number) => n.toFixed(2);

/** A CSV ready to save. */
export type CsvExport = { filename: string; csv: string; rows: number };

/**
 * Saves a CSV file. Call it directly from a tap: iOS only opens the share
 * sheet in response to a user gesture. On phones and tablets it opens the share sheet (Save to
 * Files, AirDrop, Mail…); on computers it downloads. Excel needs the leading
 * byte-order mark to read non-English characters correctly.
 */
export async function saveCsv({ filename, csv }: CsvExport): Promise<void> {
  const content = '﻿' + csv;

  if (Platform.OS !== 'web') {
    await Share.share({ title: filename, message: csv });
    return;
  }

  const file = new File([content], filename, { type: 'text/csv;charset=utf-8' });
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      // Closing the share sheet isn't an error; anything else falls back to download.
      if ((e as { name?: string }).name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const today = () => toDayString(new Date());

/** All purchases as CSV, one row per item bought. */
export async function preparePurchasesCsv(uid: string): Promise<CsvExport> {
  const purchases = await listAllPurchases(uid);
  const rows: Cell[][] = [];
  for (const p of purchases) {
    for (const line of p.lines) {
      rows.push([
        toDayString(p.date),
        p.storeName,
        line.itemName,
        line.unit,
        line.qty,
        money(line.unitPrice),
        money(line.amount),
        line.taxRate,
        money(line.tax),
        money(line.amount + line.tax),
        money(p.total),
        p.id,
      ]);
    }
  }
  const csv = toCsv(
    [
      'Date',
      'Store',
      'Item',
      'Unit',
      'Qty',
      'Unit price',
      'Amount',
      'Tax %',
      'Tax',
      'Item total',
      'Purchase total',
      'Purchase ID',
    ],
    rows
  );
  return { filename: `sa-yin-purchases-${today()}.csv`, csv, rows: rows.length };
}

/** All income as CSV, one row per franchise payment. */
export async function prepareIncomeCsv(uid: string): Promise<CsvExport> {
  const income = await listAllIncome(uid);
  const csv = toCsv(
    ['Date', 'Amount', 'Note', 'ID'],
    income.map((e) => [toDayString(e.date), money(e.amount), e.note, e.id])
  );
  return { filename: `sa-yin-income-${today()}.csv`, csv, rows: income.length };
}
