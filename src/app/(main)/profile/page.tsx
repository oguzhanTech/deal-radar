"use client";

import { useState, useEffect } from "react";
import { User, LogOut, Shield, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "@/components/deals/deal-card";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { Deal } from "@/lib/types/database";

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [showLogin, setShowLogin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("GLOBAL");
  const [saving, setSaving] = useState(false);
  const [myDeals, setMyDeals] = useState<Deal[]>([]);

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
  };

  if (!authLoading && !user) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Profile</h2>
          <p className="text-muted-foreground mb-6">Sign in to manage your profile</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </>
    );
  }

  const isTrusted = (profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD;

  return (
    <div className="py-4 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Profile</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
          <Award className="h-4 w-4 text-primary" />
          <div>
            <p className="text-lg font-bold">{profile?.trust_score ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Trust Score</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold capitalize">{profile?.role}</p>
            <p className="text-[10px] text-muted-foreground">Role</p>
          </div>
        </div>
        {isTrusted && (
          <Badge className="self-center bg-green-500 text-white border-0">
            Trusted Submitter
          </Badge>
        )}
      </div>

      {profile && (
        <p className="text-xs text-muted-foreground">
          Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
        </p>
      )}

      {/* Edit */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Country</label>
          <Select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
            className="mt-1"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>

      {/* My Deals */}
      {myDeals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">My Deals</h3>
          {myDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
