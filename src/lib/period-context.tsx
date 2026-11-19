import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './auth-context';
import { fromDayString, toDayString } from './day';
import {
  addDays,
  addMonths,
  daysBetween,
  endOfDay,
  endOfMonth,
  formatMonth,
  formatRange,
  startOfDay,
  startOfMonth,
} from './format';
import { PAYMENT_CYCLE_DAYS, useLatestIncome } from './income';

export type PeriodMode = 'month' | 'cycle';

const MODE_KEY = 'sayin.periodMode';
const ANCHOR_KEY = 'sayin.cycleStart';

type PeriodContextValue = {
  mode: PeriodMode;
  setMode: (mode: PeriodMode) => void;
  /** First moment of the period being viewed. */
  start: Date;
  /** Last moment of the period being viewed. */
  end: Date;
  /** "November 2026" or "3 Nov – 30 Nov 2026". */
  label: string;
  /** "this month" / "these 4 weeks" — for sentences like "Profit this month". */
  noun: string;
  /** True when the period contains today. */
  isCurrent: boolean;
  /** True when there is no later period that has started yet. */
  isLatest: boolean;
  /**
   * False while the saved view settings (and, for 4 weeks, the latest
   * payment) are loading — screens wait so they don't load a wrong period first.
   */
  ready: boolean;
  next: () => void;
  prev: () => void;
  /** Month mode: jump to the month containing `date`. 4-week mode: start periods on `date`. */
  pickDate: (date: Date) => void;
  /** Move the view to the period containing `date` (keeps the 4-week start day). */
  showDate: (date: Date) => void;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

/** Start of the 4-week cycle containing `day`, for cycles aligned to `anchor`. */
function cycleStartFor(anchor: Date, day: Date): Date {
  const index = Math.floor(daysBetween(anchor, day) / PAYMENT_CYCLE_DAYS);
  return addDays(startOfDay(anchor), index * PAYMENT_CYCLE_DAYS);
}

/**
 * Every screen looks at the same period: a calendar month (default) or a
 * 4-week franchise cycle. Cycles line up with a chosen start date, or with
 * the latest franchise payment if none was chosen.
 */
export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const latest = useLatestIncome(user?.uid ?? null);

  const [mode, setModeState] = useState<PeriodMode>('month');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savedAnchor, setSavedAnchor] = useState<Date | null>(null);
  // The period the user navigated to; null means "the one containing today".
  const [pickedMonth, setPickedMonth] = useState<Date | null>(null);
  const [pickedCycle, setPickedCycle] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.multiGet([MODE_KEY, ANCHOR_KEY])
      .then(([[, rawMode], [, rawAnchor]]) => {
        if (cancelled) return;
        if (rawMode === 'cycle' || rawMode === 'month') setModeState(rawMode);
        // Saved as "YYYY-MM-DD" so it means the same day in any timezone.
        const anchor = fromDayString(rawAnchor);
        if (anchor) setSavedAnchor(startOfDay(anchor));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = startOfDay(new Date());
  // With no chosen start day and no payment yet, show the last 28 days up to
  // today — anchoring on today itself would hide everything dated before it.
  const anchor =
    savedAnchor ?? latest?.date ?? addDays(today, -(PAYMENT_CYCLE_DAYS - 1));
  const anchorMs = startOfDay(anchor).getTime();
  const monthStartMs = (pickedMonth ?? startOfMonth(today)).getTime();
  const cycleStartMs = (pickedCycle ?? cycleStartFor(anchor, today)).getTime();
  const ready =
    settingsLoaded && (mode === 'month' || savedAnchor !== null || latest !== undefined);

  const value = useMemo<PeriodContextValue>(() => {
    const now = new Date();
    const setMode = (next: PeriodMode) => {
      setModeState(next);
      AsyncStorage.setItem(MODE_KEY, next).catch(() => undefined);
    };

    if (mode === 'month') {
      const start = new Date(monthStartMs);
      const end = endOfMonth(start);
      return {
        mode,
        setMode,
        start,
        end,
        label: formatMonth(start),
        noun: 'this month',
        isCurrent: now >= start && now <= end,
        isLatest: addMonths(start, 1) > now,
        ready,
        next: () => setPickedMonth(addMonths(start, 1)),
        prev: () => setPickedMonth(addMonths(start, -1)),
        pickDate: (date) => setPickedMonth(startOfMonth(date)),
        showDate: (date) => {
          if (date < start || date > end) setPickedMonth(startOfMonth(date));
        },
      };
    }

    const start = new Date(cycleStartMs);
    const end = endOfDay(addDays(start, PAYMENT_CYCLE_DAYS - 1));
    return {
      mode,
      setMode,
      start,
      end,
      label: formatRange(start, end),
      noun: 'these 4 weeks',
      isCurrent: now >= start && now <= end,
      isLatest: addDays(start, PAYMENT_CYCLE_DAYS) > now,
      ready,
      next: () => setPickedCycle(addDays(start, PAYMENT_CYCLE_DAYS)),
      prev: () => setPickedCycle(addDays(start, -PAYMENT_CYCLE_DAYS)),
      pickDate: (date) => {
        const day = startOfDay(date);
        setSavedAnchor(day);
        setPickedCycle(day);
        AsyncStorage.setItem(ANCHOR_KEY, toDayString(day)).catch(() => undefined);
      },
      showDate: (date) => {
        if (date < start || date > end) setPickedCycle(cycleStartFor(new Date(anchorMs), date));
      },
    };
  }, [mode, monthStartMs, cycleStartMs, anchorMs, ready]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used inside <PeriodProvider>');
  return ctx;
}
