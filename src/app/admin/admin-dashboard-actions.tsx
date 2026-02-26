"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { t } from "@/lib/i18n";

export function AdminDashboardActions() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(t("admin.seedSuccess"));
      } else {
        setResult(`${t("admin.seedError")}: ${data.error || ""}`);
      }
    } catch {
      setResult(t("admin.seedError"));
    }
    setSeeding(false);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSeed}
        disabled={seeding}
        className="gap-2 text-xs"
      >
        {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
        {t("admin.seed")}
      </Button>
      {result && (
        <p className={`text-[10px] ${result.includes("hata") || result.includes("ters") ? "text-destructive" : "text-green-600"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
