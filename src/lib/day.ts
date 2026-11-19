import { Timestamp } from 'firebase/firestore';

/**
 * Calendar days, independent of timezone.
 *
 * An income or purchase happens on a calendar day ("17 Nov"), not at an
 * instant. Each record stores `day: "YYYY-MM-DD"` and is always shown on that
 * day, whether it's opened in Thailand, California, on the web, a home-screen
 * shortcut or an iPad. `date` (a Timestamp at 12:00 UTC of that day) is kept
 * for ordering and for older records saved before `day` existed.
 */

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local calendar day of `date`, e.g. "2026-11-17". */
export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The given day at 12:00 local time, or null if `day` isn't YYYY-MM-DD. */
export function fromDayString(day: unknown): Date | null {
  if (typeof day !== 'string') return null;
  const match = DAY_RE.exec(day);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fields to save for the calendar day of `date`. */
export function dayFields(date: Date): { day: string; date: Timestamp } {
  const day = toDayString(date);
  return {
    day,
    date: Timestamp.fromMillis(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)
    ),
  };
}

/**
 * The calendar day of a stored record as a local Date (12:00). Uses `day` when
 * present; older records fall back to their timestamp in this device's timezone.
 */
export function readDay(data: Record<string, unknown>): Date {
  const fromDay = fromDayString(data.day);
  if (fromDay) return fromDay;
  const raw = data.date;
  if (raw instanceof Timestamp) {
    const d = raw.toDate();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  }
  return new Date();
}

/**
 * Timestamp bounds to query for the local period [start, end], widened by a
 * day each side so records stored from any timezone are included; results are
 * then filtered precisely by calendar day with `inPeriod`.
 */
export function queryBounds(start: Date, end: Date): { from: Timestamp; to: Timestamp } {
  const DAY = 86_400_000;
  return {
    from: Timestamp.fromMillis(start.getTime() - DAY),
    to: Timestamp.fromMillis(end.getTime() + DAY),
  };
}

/** True when the calendar day of `date` falls within [start, end] (local). */
export function inPeriod(date: Date, start: Date, end: Date): boolean {
  const day = toDayString(date);
  return day >= toDayString(start) && day <= toDayString(end);
}
