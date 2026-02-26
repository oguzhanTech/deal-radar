"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Trash2, XCircle, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { t } from "@/lib/i18n";
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
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const dismissReport = async (id: string) => {
    setLoadingId(id);
    const { error } = await supabase.from("deal_reports").delete().eq("id", id);
    if (error) {
      toast({ title: t("admin.toast.error"), description: error.message, variant: "destructive" });
    } else {
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast({ title: t("admin.toast.reportDismissed") });
    }
    setLoadingId(null);
  };

  const takeDownDeal = async (report: Report) => {
    if (!window.confirm(t("admin.confirm.takeDown"))) return;
    setLoadingId(report.id);
    const { error: dealError } = await supabase.from("deals").update({ status: "rejected" }).eq("id", report.deal_id);
    if (dealError) {
      toast({ title: t("admin.toast.error"), description: dealError.message, variant: "destructive" });
      setLoadingId(null);
      return;
    }
    const { error: reportError } = await supabase.from("deal_reports").delete().eq("id", report.id);
    if (reportError) {
      toast({ title: t("admin.toast.error"), description: reportError.message, variant: "destructive" });
    } else {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      toast({ title: t("admin.toast.dealTakenDown") });
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("admin.reports.title")}</h2>

      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{report.deal?.title || t("admin.reports.unknownDeal")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.reports.reportedBy")} {report.reporter?.display_name || t("admin.reports.unknownUser")} ·{" "}
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: tr })}
                </p>
              </div>
            </div>

            <p className="text-sm bg-muted/50 rounded p-2">{report.reason}</p>

            <div className="flex gap-1.5">
              {report.deal && (
                <Link href={`/deal/${report.deal.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Eye className="h-3 w-3" />
                    {t("admin.reports.viewDeal")}
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
                {t("admin.reports.dismiss")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive"
                onClick={() => takeDownDeal(report)}
                disabled={loadingId === report.id}
              >
                <Trash2 className="h-3 w-3" />
                {t("admin.reports.takeDown")}
              </Button>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t("admin.reports.empty")}</p>
        )}
      </div>
    </div>
  );
}
