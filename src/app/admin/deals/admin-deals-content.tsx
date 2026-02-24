"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import type { Deal } from "@/lib/types/database";

interface AdminDeal extends Deal {
  profile?: { display_name: string | null } | null;
}

interface AdminDealsContentProps {
  initialDeals: AdminDeal[];
}

export function AdminDealsContent({ initialDeals }: AdminDealsContentProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  const filtered = filter === "all" ? deals : deals.filter((d) => d.status === filter);

  const updateStatus = async (id: string, status: string) => {
    setLoadingId(id);
    await supabase.from("deals").update({ status }).eq("id", id);
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status: status as Deal["status"] } : d)));
    setLoadingId(null);
  };

  const deleteDeal = async (id: string) => {
    setLoadingId(id);
    await supabase.from("deals").delete().eq("id", id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setLoadingId(null);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Deals Management</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} deals</span>
      </div>

      <div className="flex gap-1.5">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition cursor-pointer ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f} {f !== "all" && `(${deals.filter((d) => d.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((deal) => (
          <div key={deal.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate">{deal.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {deal.provider} · {deal.country} · by {deal.profile?.display_name || "Unknown"}
                </p>
              </div>
              <Badge className={`text-[10px] ${statusColors[deal.status]} border-0 shrink-0`}>
                {deal.status}
              </Badge>
            </div>

            <div className="flex gap-1.5">
              {deal.status !== "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 h-7 text-xs"
                  onClick={() => updateStatus(deal.id, "approved")}
                  disabled={loadingId === deal.id}
                >
                  {loadingId === deal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Approve
                </Button>
              )}
              {deal.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 h-7 text-xs"
                  onClick={() => updateStatus(deal.id, "rejected")}
                  disabled={loadingId === deal.id}
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive h-7 text-xs ml-auto"
                onClick={() => deleteDeal(deal.id)}
                disabled={loadingId === deal.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No deals found</p>
        )}
      </div>
    </div>
  );
}
