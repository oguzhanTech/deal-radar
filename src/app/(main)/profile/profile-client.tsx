"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User, LogOut, Shield, Loader2, Award, Package, Star, ChevronRight, Zap, Trophy, Settings, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DealCard } from "@/components/deals/deal-card";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { updateProfile as updateProfileAction } from "@/app/actions";
import { ProfileAvatarUploader } from "@/components/profile/profile-avatar-uploader";
import { TRUSTED_SUBMITTER_THRESHOLD, LEVEL_THRESHOLDS, BADGE_INFO } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { BadgeId, Deal } from "@/lib/types/database";

function getLevelInfo(points: number) {
  const current = LEVEL_THRESHOLDS.find(
    (l) => points >= l.min && points <= l.max
  ) || LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find((l) => l.level === current.level + 1);
  const progressInLevel = points - current.min;
  const levelRange = (next?.min ?? current.max) - current.min;
  const progress = next ? Math.min(progressInLevel / levelRange, 1) : 1;
  return { current, next, progress, pointsToNext: next ? next.min - points : 0 };
}

interface ProfileClientProps {
  initialDeals: Deal[];
  initialDealsCount: number;
}

export function ProfileClient({ initialDeals, initialDealsCount }: ProfileClientProps) {
  const router = useRouter();
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    refreshProfile,
    setProfileDisplayName,
    setProfileAvatarUrl,
  } = useAuth();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [showLogin, setShowLogin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [myDeals, setMyDeals] = useState<Deal[]>(initialDeals);
  const [myDealsCount, setMyDealsCount] = useState<number>(initialDealsCount);
  const [showEdit, setShowEdit] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [showBadgesGuide, setShowBadgesGuide] = useState(false);
  const prevBadgesRef = useRef<BadgeId[] | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setMyDeals([]);
      setMyDealsCount(0);
      return;
    }
    const refresh = async () => {
      try {
        const res = await fetch("/api/profile/deals", { credentials: "same-origin" });
        const json = await res.json();
        const list = Array.isArray(json.deals) ? json.deals : [];
        const count = typeof json.count === "number" ? json.count : 0;
        setMyDeals(list);
        setMyDealsCount(count);
      } catch {
        // keep current state
      }
    };
    refresh();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("profile-badges")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => {
          refreshProfile().catch(() => {});
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    if (!prevBadgesRef.current) {
      prevBadgesRef.current = profile.badges ?? [];
      return;
    }
    const prev = prevBadgesRef.current;
    const current = (profile.badges ?? []) as BadgeId[];
    const newOnes = current.filter((b) => !prev.includes(b));
    if (newOnes.length > 0) {
      const labels = newOnes.map((id) => BADGE_INFO[id]?.label ?? id).join(", ");
      toast({
        title: "Yeni rozet kazanıldı!",
        description: labels,
      });
    }
    prevBadgesRef.current = current;
  }, [profile, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const result = await updateProfileAction(displayName);
      if (result.error) {
        toast({ title: t("create.error.failed"), description: result.error, variant: "destructive" });
        return;
      }
      if ("display_name" in result && result.display_name) {
        setProfileDisplayName(result.display_name);
      }
      toast({ title: t("profile.updated") });
      setShowEdit(false);
      await refreshProfile();
    } catch {
      toast({ title: t("create.error.failed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleting) return;
    const confirmed = window.confirm(
      "Hesabını ve kişisel verilerini silmek istediğinden emin misin? Bu işlem geri alınamaz."
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast({
          title: t("create.error.failed"),
          description: "Hesap silme işlemi sırasında bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }
      await signOut();
      router.push("/");
    } catch {
      toast({
        title: t("create.error.failed"),
        description: "Hesap silme işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5">
            <User className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("profile.title")}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{t("profile.signInDesc")}</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            {t("common.signIn")}
          </button>
        </div>

        <div className="mx-4 my-6 border-t border-border/60 pt-3">
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              {t("legal.privacy")}
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="underline-offset-4 hover:underline">
              {t("legal.terms")}
            </Link>
            <span className="text-border">•</span>
            <Link href="/contact" className="underline-offset-4 hover:underline">
              {t("legal.contact")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isTrusted = (profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD;
  const initial = profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";
  const points = profile?.points ?? 0;
  const level = profile?.level ?? 1;
  const badges = profile?.badges ?? [];
  const levelInfo = getLevelInfo(points);
  const allBadges = Object.entries(BADGE_INFO) as [BadgeId, (typeof BADGE_INFO)[BadgeId]][];

  return (
    <div className="pb-4">
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-5 text-white shadow-card relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-white/5" />
        <div className="flex items-center gap-4 relative z-10">
          <ProfileAvatarUploader
            currentUrl={profile?.profile_image_url ?? null}
            fallbackLetter={initial}
            onUploaded={(url, path) => setProfileAvatarUrl(url, path)}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{profile?.display_name || t("profile.anonymous")}</h2>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
            {profile && (
              <p className="text-white/50 text-[10px] mt-0.5">
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: tr })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4 relative z-10 flex-wrap">
          <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] font-bold backdrop-blur-sm">
            {levelInfo.current.label}
          </Badge>
          {isTrusted && (
            <Badge className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-[10px] font-bold gap-1 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-current" /> {t("profile.trusted")}
            </Badge>
          )}
          <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] capitalize backdrop-blur-sm">
            <Shield className="h-2.5 w-2.5 mr-0.5" /> {profile?.role}
          </Badge>
        </div>
      </div>

      {profile?.role === "admin" && (
        <Link
          href="/admin"
          prefetch
          onMouseEnter={() => router.prefetch("/admin")}
          onTouchStart={() => router.prefetch("/admin")}
          className="mx-4 mt-4 flex items-center justify-between bg-card rounded-2xl px-4 py-3.5 shadow-card active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Settings className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-semibold text-sm">{t("admin.title")}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="mx-4 mt-4 bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              {level}
            </div>
            <div>
              <p className="text-sm font-bold">{levelInfo.current.label}</p>
              <p className="text-[10px] text-muted-foreground">{t("levelUp.level")} {level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-500" /> {points}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("profile.points")}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${levelInfo.progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span>{levelInfo.current.min} {t("profile.points")}</span>
            {levelInfo.next ? (
              <span>{levelInfo.pointsToNext} {t("profile.pointsToNext")} {levelInfo.next.level}</span>
            ) : (
              <span>{t("profile.maxLevel")}</span>
            )}
          </div>
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
            onClick={() => setShowPointsInfo((v) => !v)}
          >
            <Info className="h-3 w-3" />
            {t("profile.pointsInfoTrigger")}
          </button>
          {showPointsInfo && (
            <div className="mt-2 rounded-2xl bg-muted px-3 py-2 text-[11px] text-muted-foreground space-y-1">
              <p className="text-xs font-semibold text-foreground mb-1">{t("profile.pointsInfoTitle")}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t("profile.pointsInfoApproved")}</li>
                <li>{t("profile.pointsInfoSaved")}</li>
                <li>{t("profile.pointsInfoVoted")}</li>
                <li>{t("profile.pointsInfoTrending")}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Award className="h-5 w-5 text-indigo-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{profile?.trust_score ?? 0}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{t("profile.trust")}</p>
        </div>
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Package className="h-5 w-5 text-violet-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{myDealsCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{t("profile.deals")}</p>
        </div>
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{badges.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{t("profile.badges")}</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
            <h3 className="text-sm font-bold">{t("profile.badgesTitle")}</h3>
            <button
              type="button"
              className="text-[11px] text-primary font-medium hover:underline cursor-pointer"
              onClick={() => setShowBadgesGuide(true)}
            >
              Nasıl kazanılır?
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badge) => {
              const info = BADGE_INFO[badge];
              if (!info) return null;
              return (
                <div key={badge} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-2.5">
                  <span className="text-2xl">{info.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{info.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="mx-4 mt-4">
          <div className="mb-2.5 px-0.5">
            <h3 className="text-sm font-bold">{t("profile.badgesToEarn")}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Yorum yaparak ve fırsat paylaşarak rozet topla. Rehberden tüm şartları görebilirsin.
            </p>
            <button
              type="button"
              className="mt-1 text-[11px] text-primary font-medium hover:underline cursor-pointer"
              onClick={() => setShowBadgesGuide(true)}
            >
              Rozet rehberini aç
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(BADGE_INFO).map(([id, info]) => (
              <div key={id} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-2.5 opacity-40">
                <span className="text-2xl grayscale">{info.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{info.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mt-4">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="w-full flex items-center justify-between bg-card rounded-2xl px-4 py-3.5 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="font-semibold text-sm">{t("profile.editProfile")}</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showEdit ? "rotate-90" : ""}`} />
        </button>
      </div>

      {showEdit && (
        <div className="mx-4 animate-[fade-in_0.2s_ease-out]">
          <div className="space-y-3 pt-3 pb-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t("profile.displayName")}</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.displayNamePlaceholder")}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.saveChanges")}
            </Button>
          </div>
        </div>
      )}

      {myDeals.length > 0 && (
        <div className="mx-4 mt-6 space-y-3">
          <h3 className="text-lg font-bold px-0.5">{t("profile.myDeals")}</h3>
          {myDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} hideCreator />
          ))}
        </div>
      )}

      <div className="mx-4 my-6 border-t border-border/60 pt-3">
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground items-center">
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            {t("legal.privacy")}
          </Link>
          <span className="text-border">•</span>
          <Link href="/terms" className="underline-offset-4 hover:underline">
            {t("legal.terms")}
          </Link>
          <span className="text-border">•</span>
          <Link href="/contact" className="underline-offset-4 hover:underline">
            {t("legal.contact")}
          </Link>
          {user && (
            <>
              <span className="text-border">•</span>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="underline-offset-4 hover:underline text-destructive disabled:opacity-60"
              >
                Hesabımı sil
              </button>
            </>
          )}
        </div>
      </div>

      <Sheet open={showBadgesGuide} onOpenChange={setShowBadgesGuide}>
        <SheetContent
          side="bottom"
          className="max-w-[min(100vw,42rem)] mx-auto rounded-t-2xl border-x-0 border-b-0 px-4 pt-4 pb-5"
        >
          <SheetHeader className="mb-3">
            <SheetTitle className="text-base">Rozet Rehberi</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Rozetler aktifliğine göre otomatik verilir. Aşağıdaki hedefleri tamamla.
            </p>
          </SheetHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-2">
            {allBadges.map(([id, info]) => {
              const earned = badges.includes(id);
              return (
                <div
                  key={id}
                  className={`rounded-2xl border p-3 flex items-center gap-2.5 ${
                    earned ? "bg-primary/5 border-primary/20" : "bg-card border-border/60"
                  }`}
                >
                  <span className={`text-2xl ${earned ? "" : "grayscale opacity-70"}`}>{info.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate">{info.label}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          earned
                            ? "bg-green-500/15 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {earned ? "Alındı" : "Hedef"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
