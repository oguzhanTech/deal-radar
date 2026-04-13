"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPassword, signInWithGoogleAction, signUpWithPassword } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Loader2, Lock } from "lucide-react";
import { t } from "@/lib/i18n";

const PASSWORD_MIN = 8;
const DISPLAY_NAME_MAX = 40;
const SIGNUP_CLIENT_COOLDOWN_MS = 90_000;
const SIGNUP_COOLDOWN_KEY = "auth_signup_cooldown";

function getSignUpCooldown(email: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_COOLDOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email: string; expiresAt: number };
    if (parsed.email !== email.trim().toLowerCase()) return null;
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SIGNUP_COOLDOWN_KEY);
      return null;
    }
    return parsed.expiresAt;
  } catch {
    return null;
  }
}

function setSignUpCooldown(email: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SIGNUP_COOLDOWN_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        expiresAt: Date.now() + SIGNUP_CLIENT_COOLDOWN_MS,
      })
    );
  } catch {
    // ignore storage failures
  }
}

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = () => setError(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setNeedsConfirm(false);
      setError(null);
      setLoading(false);
    }
    onOpenChange(next);
  };

  const handleGoogle = async () => {
    const result = await signInWithGoogleAction(window.location.origin);
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const validateSignIn = () => {
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return false;
    }
    if (password.length < PASSWORD_MIN) {
      setError(t("auth.passwordHint"));
      return false;
    }
    return true;
  };

  const validateSignUp = () => {
    if (!validateSignIn()) return false;
    const name = displayName.trim();
    if (!name) {
      setError(t("auth.displayNameRequired"));
      return false;
    }
    if (name.length > DISPLAY_NAME_MAX) {
      setError(t("auth.displayNameTooLong"));
      return false;
    }
    if (!/\d/.test(password)) {
      setError(t("auth.passwordNeedsDigit"));
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    if (!validateSignIn()) return;
    setLoading(true);
    try {
      const result = await signInWithPassword(email, password);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        handleOpenChange(false);
        router.refresh();
      }
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    if (!validateSignUp()) return;
    const cooldownUntil = getSignUpCooldown(email);
    if (cooldownUntil) {
      const waitSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setError(`Bu e-posta ile az önce kayıt denendi. ${waitSeconds} saniye sonra tekrar deneyin.`);
      return;
    }
    setLoading(true);
    try {
      const result = await signUpWithPassword(
        email,
        password,
        displayName,
        window.location.origin
      );
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
        setSignUpCooldown(email);
        setNeedsConfirm(true);
      } else if ("success" in result && result.success) {
        setSignUpCooldown(email);
        handleOpenChange(false);
        router.refresh();
      }
    } catch {
      setError(t("auth.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[340px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("auth.welcome")}</DialogTitle>
          <DialogDescription>{t("auth.signInDesc")}</DialogDescription>
        </DialogHeader>

        {needsConfirm ? (
          <div className="text-center py-4">
            <Mail className="h-12 w-12 mx-auto text-primary mb-3" />
            <p className="font-medium">{t("auth.checkEmail")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("auth.confirmEmailBody")} <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <Button variant="outline" className="w-full h-11" onClick={handleGoogle}>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("auth.googleSignIn")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("common.or")}</span>
              </div>
            </div>

            <Tabs
              defaultValue="signin"
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                resetError();
              }}
              className="w-full"
            >
              <TabsList className="w-full h-9">
                <TabsTrigger value="signin" className="text-xs">
                  {t("auth.tabSignIn")}
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs">
                  {t("auth.tabSignUp")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 pt-2">
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={PASSWORD_MIN}
                  />
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {t("auth.signInSubmit")}
                      </>
                    )}
                  </Button>
                  <div className="text-center">
                    <Link
                      href="/forgot-password"
                      className="inline-flex text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{t("auth.passwordHint")}</p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3 pt-2">
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder={t("auth.displayNamePlaceholder")}
                    aria-label={t("auth.displayNameLabel")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    maxLength={DISPLAY_NAME_MAX}
                  />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={PASSWORD_MIN}
                  />
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {t("auth.signUpSubmit")}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{t("auth.passwordHint")}</p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
