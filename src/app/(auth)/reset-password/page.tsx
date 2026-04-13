"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Radar } from "lucide-react";
import { t } from "@/lib/i18n";

const PASSWORD_MIN = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN) {
      setError(t("auth.passwordHint"));
      return;
    }
    if (!/\d/.test(password)) {
      setError(t("auth.passwordNeedsDigit"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.resetPasswordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 900);
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
          <h1 className="text-2xl font-bold">{t("auth.resetTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("auth.resetDesc")}</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <p className="font-medium">{t("auth.resetSuccessTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("auth.resetSuccessBody")}</p>
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
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.resetNewPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN}
              className="h-12 text-base"
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.resetConfirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN}
              className="h-12 text-base"
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t("auth.resetSubmit")}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t("auth.passwordHint")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
