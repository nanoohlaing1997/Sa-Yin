import React, { createContext, useContext, useMemo, useState } from 'react';

import { startOfMonth } from './format';

type MonthContextValue = {
  month: Date;
  setMonth: (next: Date) => void;
};

const MonthContext = createContext<MonthContextValue | null>(null);

/** Keeps the Report and Transactions tabs looking at the same month. */
export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonthState] = useState(() => startOfMonth(new Date()));
  const value = useMemo(
    () => ({ month, setMonth: (next: Date) => setMonthState(startOfMonth(next)) }),
    [month]
  );
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used inside <MonthProvider>');
  return ctx;
}
