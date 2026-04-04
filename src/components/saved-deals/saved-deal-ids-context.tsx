"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
}

/** Kayıtlı fırsat ID’leri sunucuda bloklanmaz; oturum açıksa client’ta tek sorgu yüklenir. */
export function SavedDealIdsProvider({ children }: SavedDealIdsProviderProps) {
  const { user } = useAuth();
  const [savedDealIds, setSavedDealIds] = useState<SavedDealIdsState>(() => (user ? new Set() : null));

  useEffect(() => {
    if (!user) {
      setSavedDealIds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("deal_saves").select("deal_id").eq("user_id", user.id);
      if (!cancelled) {
        setSavedDealIds(new Set((data ?? []).map((r) => r.deal_id)));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca kullanıcı kimliği değişince yeniden yükle
  }, [user?.id]);

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
