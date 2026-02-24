"use client";

import { useState, useEffect, useMemo } from "react";
import { User, LogOut, Shield, Loader2, Award, Package, Star, ChevronRight, Zap, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "@/components/deals/deal-card";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, TRUSTED_SUBMITTER_THRESHOLD, LEVEL_THRESHOLDS, BADGE_INFO } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { Deal } from "@/lib/types/database";

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

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [showLogin, setShowLogin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("GLOBAL");
  const [saving, setSaving] = useState(false);
  const [myDeals, setMyDeals] = useState<Deal[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setCountry(profile.country || "GLOBAL");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("deals")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setMyDeals(data ?? []);
    };
    fetch();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName, country })
      .eq("user_id", user.id);
    await refreshProfile();
    toast({ title: "Profile updated" });
    setSaving(false);
    setShowEdit(false);
  };

  if (!authLoading && !user) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5">
            <User className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
          <p className="text-muted-foreground mb-8 text-sm">Sign in to manage your profile and track your deals</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            Sign in
          </button>
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

  return (
    <div className="pb-4">
      {/* Profile Header Card */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-5 text-white shadow-card relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-white/5" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold shadow-lg">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{profile?.display_name || "Anonymous"}</h2>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
            {profile && (
              <p className="text-white/50 text-[10px] mt-0.5">
                Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-4 relative z-10 flex-wrap">
          {isTrusted && (
            <Badge className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-[10px] font-bold gap-1 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-current" /> Trusted Submitter
            </Badge>
          )}
          <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] capitalize backdrop-blur-sm">
            <Shield className="h-2.5 w-2.5 mr-0.5" /> {profile?.role}
          </Badge>
        </div>
      </div>

      {/* Level Card */}
      <div className="mx-4 mt-4 bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              {level}
            </div>
            <div>
              <p className="text-sm font-bold">{levelInfo.current.label}</p>
              <p className="text-[10px] text-muted-foreground">Level {level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-500" /> {points}
            </p>
            <p className="text-[10px] text-muted-foreground">points</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1">
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{levelInfo.current.min} pts</span>
            {levelInfo.next ? (
              <span>{levelInfo.pointsToNext} pts to Level {levelInfo.next.level}</span>
            ) : (
              <span>Max level reached!</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Award className="h-5 w-5 text-indigo-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{profile?.trust_score ?? 0}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Trust</p>
        </div>
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Package className="h-5 w-5 text-violet-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{myDeals.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Deals</p>
        </div>
        <div className="bg-card rounded-2xl p-3.5 shadow-card text-center">
          <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-xl font-extrabold">{badges.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Badges</p>
        </div>
      </div>

      {/* Badge Gallery */}
      {badges.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-sm font-bold mb-2.5 px-0.5">Badges</h3>
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

      {/* All Badges (locked/unlocked) */}
      {badges.length === 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-sm font-bold mb-2.5 px-0.5">Badges to Earn</h3>
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

      {/* Edit Profile Toggle */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="w-full flex items-center justify-between bg-card rounded-2xl px-4 py-3.5 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="font-semibold text-sm">Edit Profile</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showEdit ? "rotate-90" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mx-4"
          >
            <div className="space-y-3 pt-3 pb-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Country</label>
                <Select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Deals */}
      {myDeals.length > 0 && (
        <div className="mx-4 mt-6 space-y-3">
          <h3 className="text-lg font-bold px-0.5">My Deals</h3>
          {myDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
