"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shouldOpenAuthInNativeApp } from "@/lib/auth/should-open-auth-in-native-app";
import { t } from "@/lib/i18n";

function ConfirmEmailInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(t("auth.confirmRedirecting"));

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      window.location.replace("/login?error=auth");
      return;
    }

    const qs = searchParams.toString();
    const origin = window.location.origin;
    const target = shouldOpenAuthInNativeApp()
      ? `${origin}/auth/callback?${qs}`
      : `${origin}/auth/complete-web?${qs}`;

    setMessage(t("auth.confirmRedirecting"));
    window.location.replace(target);
  }, [searchParams]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-primary/5 to-background">
      <p className="text-muted-foreground text-center text-sm">{message}</p>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-primary/5 to-background">
          <p className="text-muted-foreground text-center text-sm">{t("auth.confirmRedirecting")}</p>
        </div>
      }
    >
      <ConfirmEmailInner />
    </Suspense>
  );
}
