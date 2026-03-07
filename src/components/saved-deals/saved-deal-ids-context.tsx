"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

type SavedDealIdsState = Set<string> | null;

interface SavedDealIdsContextValue {
  savedDealIds: SavedDealIdsState;
  isSaved: (dealId: string) => boolean;
  addSaved: (dealId: string) => void;
  removeSaved: (dealId: string) => void;
}

const SavedDealIdsContext = createContext<SavedDealIdsContextValue>({
  savedDealIds: null,
  isSaved: () => false,
  addSaved: () => {},
  removeSaved: () => {},
});

export function useSavedDealIds() {
  return useContext(SavedDealIdsContext);
}

interface SavedDealIdsProviderProps {
  children: React.ReactNode;
  /** Sunucudan gelen kayıtlı deal ID'leri (radar butonu ve Radarım senkronu için). */
  initialSavedDealIds?: string[];
}

export function SavedDealIdsProvider({ children, initialSavedDealIds = [] }: SavedDealIdsProviderProps) {
  const { user } = useAuth();
  const [savedDealIds, setSavedDealIds] = useState<SavedDealIdsState>(() =>
    user ? new Set(initialSavedDealIds) : null
  );

  useEffect(() => {
    if (!user) {
      setSavedDealIds(null);
      return;
    }
    setSavedDealIds(new Set(initialSavedDealIds));
  }, [user?.id, initialSavedDealIds]);

  const isSaved = useCallback(
    (dealId: string) => (savedDealIds ? savedDealIds.has(dealId) : false),
    [savedDealIds]
  );

  const addSaved = useCallback((dealId: string) => {
    setSavedDealIds((prev) => {
      const next = new Set(prev ?? []);
      next.add(dealId);
      return next;
    });
  }, []);

  const removeSaved = useCallback((dealId: string) => {
    setSavedDealIds((prev) => {
      if (!prev) return prev;
      const next = new Set(prev);
      next.delete(dealId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ savedDealIds, isSaved, addSaved, removeSaved }),
    [savedDealIds, isSaved, addSaved, removeSaved]
  );

  return (
    <SavedDealIdsContext.Provider value={value}>
      {children}
    </SavedDealIdsContext.Provider>
  );
}
