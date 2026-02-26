"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import Link from "next/link";
import type { Deal } from "@/lib/types/database";

interface PendingDeal extends Deal {
  profile?: { display_name: string | null } | null;
}

interface AdminPendingDealsProps {
  initialDeals: PendingDeal[];
}

export function AdminPendingDeals({ initialDeals }: AdminPendingDealsProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const updateStatus = async (id: string, status: string) => {
    if (status === "rejected" && !window.confirm(t("admin.confirm.reject"))) return;
    setLoadingId(id);
    const { error } = await supabase.from("deals").update({ status }).eq("id", id);
    if (error) {
      toast({ title: t("admin.toast.error"), description: error.message, variant: "destructive" });
    } else {
      setDeals((prev) => prev.filter((d) => d.id !== id));
      toast({ title: status === "approved" ? t("admin.toast.approved") : t("admin.toast.rejected") });
    }
    setLoadingId(null);
  };

  if (deals.length === 0) {
    return (
      <div className="border rounded-xl p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("admin.pending.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {deals.map((deal) => (
          <div key={deal.id} className="border rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">{deal.title}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {deal.provider} · {t("admin.deals.by")} {deal.profile?.display_name || t("admin.users.unnamed")}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-green-600 gap-1"
                onClick={() => updateStatus(deal.id, "approved")}
                disabled={loadingId === deal.id}
              >
                {loadingId === deal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                {t("admin.deals.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 gap-1"
                onClick={() => updateStatus(deal.id, "rejected")}
                disabled={loadingId === deal.id}
              >
                <XCircle className="h-3 w-3" />
                {t("admin.deals.reject")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/admin/deals?filter=pending"
        className="flex items-center justify-center gap-1 text-xs text-primary font-medium hover:underline py-1"
      >
        {t("admin.pending.seeAll")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
