"use client";

import { useState, useEffect } from "react";
import { Radar, Trash2, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DealCountdown } from "@/components/deals/deal-countdown";
import { HeatBadge } from "@/components/deals/heat-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { Deal, DealSave } from "@/lib/types/database";
import Link from "next/link";
import Image from "next/image";

interface SavedDeal extends DealSave {
  deal: Deal;
}

export default function MyRadarPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [saves, setSaves] = useState<SavedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("deal_saves")
        .select("*, deal:deals(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSaves((data as unknown as SavedDeal[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [user, authLoading, supabase]);

  const handleRemove = async (dealId: string) => {
    if (!user) return;
    await supabase.from("deal_saves").delete().eq("user_id", user.id).eq("deal_id", dealId);
    setSaves((prev) => prev.filter((s) => s.deal_id !== dealId));
    toast({ title: "Removed from your radar" });
  };

  if (!authLoading && !user) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <Radar className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">My Radar</h2>
          <p className="text-muted-foreground mb-6">Sign in to save deals and track reminders</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold">My Radar</h2>
        <p className="text-sm text-muted-foreground">{saves.length} saved deals</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="w-20 h-14 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="text-center px-4 py-12">
          <Radar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No saved deals yet</p>
          <p className="text-sm text-muted-foreground mt-1">Browse deals and tap &quot;Save &amp; Remind Me&quot;</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <AnimatePresence>
            {saves.map((save) => {
              const d = save.deal;
              const hasReminders = Object.values(save.reminder_settings || {}).some(Boolean);

              return (
                <motion.div
                  key={save.deal_id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                >
                  <div className="flex gap-3 items-center border rounded-xl p-3 bg-card">
                    <Link href={`/deal/${d.id}`} className="shrink-0">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted">
                        {d.image_url && (
                          <Image src={d.image_url} alt={d.title} fill className="object-cover" sizes="80px" />
                        )}
                      </div>
                    </Link>

                    <Link href={`/deal/${d.id}`} className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{d.title}</h3>
                      <DealCountdown endAt={d.end_at} compact className="text-xs" />
                      <div className="flex items-center gap-2 mt-0.5">
                        <HeatBadge score={d.heat_score} />
                        {hasReminders ? (
                          <Badge variant="secondary" className="text-[10px] py-0 gap-0.5">
                            <Bell className="h-2.5 w-2.5" /> On
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 gap-0.5 text-muted-foreground">
                            <BellOff className="h-2.5 w-2.5" /> Off
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={() => handleRemove(d.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
