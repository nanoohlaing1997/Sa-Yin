const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatSignedMoney(amount: number, currency = 'USD'): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
}

/** "12 Nov 2026" */
export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/** "November 2026" */
export function formatMonth(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Stable key for grouping, e.g. "2026-11". */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Parses a typed amount. Accepts "1234.5", "1,234.50" (comma as thousands
 * separator) and "12,5" (comma as decimal separator). Returns NaN if invalid.
 */
export function parseAmount(raw: string): number {
  let text = raw.trim().replace(/[\s$฿]/g, '');
  if (!text) return NaN;
  if (text.includes('.') && text.includes(',')) {
    text = text.replace(/,/g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(text)) {
    text = text.replace(/,/g, '');
  } else {
    text = text.replace(',', '.');
  }
  if (!/^\d*\.?\d*$/.test(text)) return NaN;
  return Number(text);
}

/**
 * Default date for a new entry: today when it falls inside the period being
 * viewed, otherwise the period's last day — so the new entry shows up on the
 * screen the user came from.
 */
export function defaultEntryDate(start: Date, end: Date): Date {
  const now = new Date();
  if (now >= start && now <= end) return now;
  const last = new Date(end);
  last.setHours(12, 0, 0, 0);
  return last;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Calendar-day arithmetic (safe across daylight-saving changes). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole calendar days from `a` to `b` (negative if `b` is earlier). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/** "3 Nov – 30 Nov 2026", or "17 Dec 2026 – 13 Jan 2027" across years. */
export function formatRange(start: Date, end: Date): string {
  const short = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  return start.getFullYear() === end.getFullYear()
    ? `${short(start)} – ${short(end)} ${end.getFullYear()}`
    : `${formatDate(start)} – ${formatDate(end)}`;
}
