"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Trash2, XCircle, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Report {
  id: string;
  deal_id: string;
  user_id: string;
  reason: string;
  created_at: string;
  deal?: { title: string; id: string } | null;
  reporter?: { display_name: string | null } | null;
}

interface AdminReportsContentProps {
  initialReports: Report[];
}

export function AdminReportsContent({ initialReports }: AdminReportsContentProps) {
  const [reports, setReports] = useState(initialReports);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  const dismissReport = async (id: string) => {
    setLoadingId(id);
    await supabase.from("deal_reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    setLoadingId(null);
  };

  const takeDownDeal = async (report: Report) => {
    setLoadingId(report.id);
    await supabase.from("deals").update({ status: "rejected" }).eq("id", report.deal_id);
    await supabase.from("deal_reports").delete().eq("id", report.id);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reports</h2>

      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{report.deal?.title || "Unknown deal"}</p>
                <p className="text-xs text-muted-foreground">
                  Reported by {report.reporter?.display_name || "Unknown"} ·{" "}
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <p className="text-sm bg-muted/50 rounded p-2">{report.reason}</p>

            <div className="flex gap-1.5">
              {report.deal && (
                <Link href={`/deal/${report.deal.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Eye className="h-3 w-3" />
                    View Deal
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => dismissReport(report.id)}
                disabled={loadingId === report.id}
              >
                {loadingId === report.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive"
                onClick={() => takeDownDeal(report)}
                disabled={loadingId === report.id}
              >
                <Trash2 className="h-3 w-3" />
                Take Down Deal
              </Button>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No reports to review</p>
        )}
      </div>
    </div>
  );
}
