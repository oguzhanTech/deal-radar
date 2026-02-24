"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Trash2, Loader2, Pencil, X, Save } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", end_at: "", original_price: "", deal_price: "" });
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

  const startEdit = (deal: AdminDeal) => {
    setEditingId(deal.id);
    setEditForm({
      title: deal.title,
      end_at: deal.end_at ? new Date(deal.end_at).toISOString().slice(0, 16) : "",
      original_price: deal.original_price?.toString() ?? "",
      deal_price: deal.deal_price?.toString() ?? "",
    });
  };

  const saveEdit = async (id: string) => {
    setLoadingId(id);
    const original = editForm.original_price ? parseFloat(editForm.original_price) : null;
    const dealPrice = editForm.deal_price ? parseFloat(editForm.deal_price) : null;
    const discount = original && dealPrice
      ? Math.round(((original - dealPrice) / original) * 100)
      : null;

    await supabase.from("deals").update({
      title: editForm.title,
      end_at: editForm.end_at ? new Date(editForm.end_at).toISOString() : undefined,
      original_price: original,
      deal_price: dealPrice,
      discount_percent: discount,
    }).eq("id", id);

    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              title: editForm.title,
              end_at: editForm.end_at ? new Date(editForm.end_at).toISOString() : d.end_at,
              original_price: original,
              deal_price: dealPrice,
              discount_percent: discount,
            }
          : d
      )
    );
    setEditingId(null);
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
            {editingId === deal.id ? (
              <div className="space-y-2">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title"
                  className="text-sm h-8"
                />
                <Input
                  type="datetime-local"
                  value={editForm.end_at}
                  onChange={(e) => setEditForm((f) => ({ ...f, end_at: e.target.value }))}
                  className="text-sm h-8"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.original_price}
                    onChange={(e) => setEditForm((f) => ({ ...f, original_price: e.target.value }))}
                    placeholder="Original price"
                    className="text-sm h-8"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.deal_price}
                    onChange={(e) => setEditForm((f) => ({ ...f, deal_price: e.target.value }))}
                    placeholder="Deal price"
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveEdit(deal.id)} disabled={loadingId === deal.id}>
                    {loadingId === deal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => startEdit(deal)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
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
              </>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No deals found</p>
        )}
      </div>
    </div>
  );
}
