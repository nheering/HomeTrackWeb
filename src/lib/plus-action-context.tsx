'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type PlusActionContextValue = {
  plusAction: (() => void) | null;
  setPlusAction: (fn: (() => void) | null) => void;
};

const PlusActionContext = createContext<PlusActionContextValue>({
  plusAction: null,
  setPlusAction: () => {},
});

export function PlusActionProvider({ children }: { children: ReactNode }) {
  const [plusAction, setRaw] = useState<(() => void) | null>(null);

  // Wrap in () => fn so React doesn't treat fn as an updater function
  const setPlusAction = useCallback((fn: (() => void) | null) => {
    setRaw(fn === null ? null : () => fn);
  }, []);

  return (
    <PlusActionContext.Provider value={{ plusAction, setPlusAction }}>
      {children}
    </PlusActionContext.Provider>
  );
}

export function usePlusActionContext() {
  return useContext(PlusActionContext);
}

/** Registriert eine Aktion für den + Button. Wird beim Unmount automatisch entfernt. */
export function usePlusAction(fn: (() => void) | null, deps: readonly unknown[]) {
  const { setPlusAction } = useContext(PlusActionContext);
  useEffect(() => {
    setPlusAction(fn);
    return () => setPlusAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
