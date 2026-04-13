"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Radar } from "lucide-react";
import { t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email, window.location.origin);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Radar className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{t("auth.forgotTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("auth.forgotDesc")}</p>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <Mail className="h-12 w-12 mx-auto text-primary" />
            <p className="font-medium">{t("auth.forgotSentTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("auth.forgotSentBody")} <strong>{email}</strong>
            </p>
            <Link
              href="/login"
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("auth.backToSignIn")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  {t("auth.forgotSubmit")}
                </>
              )}
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("auth.backToSignIn")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
