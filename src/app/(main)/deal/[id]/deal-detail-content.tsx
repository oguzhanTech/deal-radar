"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  ExternalLink,
  Flag,
  Loader2,
  ArrowLeft,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DealCountdown } from "@/components/deals/deal-countdown";
import { HeatBadge } from "@/components/deals/heat-badge";
import { SaveRemindButton } from "@/components/deals/save-remind-button";
import { DealCard } from "@/components/deals/deal-card";
import { useAuth } from "@/components/auth/auth-provider";
import { useAuthGuard } from "@/components/auth/auth-guard";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { getCountryFlag, formatPrice } from "@/lib/utils";
import { TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import type { Deal, DealComment } from "@/lib/types/database";

interface DealDetailContentProps {
  deal: Deal;
  comments: (DealComment & { profile?: { display_name: string | null; trust_score: number } | null })[];
  voteCount: number;
  saveCount: number;
  similarDeals: Deal[];
}

export function DealDetailContent({
  deal,
  comments: initialComments,
  voteCount: initialVoteCount,
  saveCount,
  similarDeals,
}: DealDetailContentProps) {
  const { user } = useAuth();
  const { requireAuth, AuthModal } = useAuthGuard();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [comments, setComments] = useState(initialComments);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [commentText, setCommentText] = useState("");
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isExpired = new Date(deal.end_at) < new Date();

  const handleVote = (vote: 1 | -1) => {
    requireAuth(async () => {
      if (!user || voting) return;
      setVoting(true);
      try {
        if (userVote === vote) {
          await supabase.from("deal_votes").delete().eq("user_id", user.id).eq("deal_id", deal.id);
          setVoteCount((v) => v - vote);
          setUserVote(null);
        } else {
          await supabase.from("deal_votes").upsert({ user_id: user.id, deal_id: deal.id, vote });
          setVoteCount((v) => v - (userVote ?? 0) + vote);
          setUserVote(vote);
        }
      } catch {
        toast({ title: "Vote failed", variant: "destructive" });
      }
      setVoting(false);
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(async () => {
      if (!user || !commentText.trim() || commenting) return;
      setCommenting(true);
      const { data, error } = await supabase
        .from("deal_comments")
        .insert({ deal_id: deal.id, user_id: user.id, content: commentText.trim() })
        .select("*, profile:profiles(display_name, trust_score)")
        .single();
      if (data && !error) {
        setComments((prev) => [...prev, data]);
        setCommentText("");
        toast({ title: "Comment posted" });
      }
      setCommenting(false);
    });
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/deal/${deal.id}`;
      if (navigator.share) {
        await navigator.share({ title: deal.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch {
      // User cancelled share or permission denied
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <AuthModal />

      {/* Hero Image */}
      <div className="relative aspect-[16/9] bg-muted">
        {deal.image_url && (
          <Image src={deal.image_url} alt={deal.title} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>

        {isExpired && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm">Deal Expired</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-xl h-9 w-9 p-0"
          disabled={reporting}
          onClick={() => {
            requireAuth(async () => {
              if (!user) return;
              setReporting(true);
              const reason = prompt("Why are you reporting this deal?");
              if (reason) {
                await supabase.from("deal_reports").insert({
                  deal_id: deal.id,
                  user_id: user.id,
                  reason,
                });
                toast({ title: "Report submitted" });
              }
              setReporting(false);
            });
          }}
        >
          <Flag className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="px-4 pt-4 space-y-4">
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold">{deal.provider}</Badge>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {getCountryFlag(deal.country)} {deal.country}
          </Badge>
          {deal.category && <Badge variant="outline" className="text-[10px]">{deal.category}</Badge>}
          <HeatBadge score={deal.heat_score} />
        </div>

        <h1 className="text-xl font-extrabold leading-tight">{deal.title}</h1>

        <DealCountdown endAt={deal.end_at} />

        {/* Price Card */}
        {deal.deal_price != null && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              {deal.original_price != null && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(deal.original_price, deal.currency)}
                </p>
              )}
              <p className="text-2xl font-extrabold text-emerald-600">
                {formatPrice(deal.deal_price, deal.currency)}
              </p>
            </div>
            {deal.discount_percent && (
              <Badge className="bg-emerald-500 text-white border-0 text-base font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm">
                -{deal.discount_percent}%
              </Badge>
            )}
          </div>
        )}

        {/* Vote Row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card rounded-2xl overflow-hidden shadow-card">
            <button
              onClick={() => handleVote(1)}
              disabled={voting}
              className={`px-3.5 py-2.5 transition cursor-pointer flex items-center gap-1.5 ${
                userVote === 1 ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-bold">Up</span>
            </button>
            <span className="px-3 text-sm font-bold tabular-nums min-w-[32px] text-center border-x border-border/50">
              {voteCount}
            </span>
            <button
              onClick={() => handleVote(-1)}
              disabled={voting}
              className={`px-3.5 py-2.5 transition cursor-pointer flex items-center gap-1.5 ${
                userVote === -1 ? "bg-destructive/10 text-destructive" : "hover:bg-muted"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl gap-1.5">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={async () => {
              try {
                const res = await fetch(`/api/deals/share-card?id=${deal.id}`);
                if (!res.ok) {
                  toast({ title: "Failed to generate card", variant: "destructive" });
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${deal.title.replace(/[^a-zA-Z0-9]/g, "_")}_deal.png`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Card downloaded!" });
              } catch {
                toast({ title: "Download failed", variant: "destructive" });
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground font-medium ml-auto">{saveCount} saves</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="py-3"
            >
              {deal.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{deal.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="comments">
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 py-3"
            >
              {comments.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl p-3.5 shadow-card space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      {c.profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-semibold">
                      {c.profile?.display_name || "User"}
                    </span>
                    {c.profile && c.profile.trust_score >= TRUSTED_SUBMITTER_THRESHOLD && (
                      <Badge variant="secondary" className="text-[8px] py-0 px-1.5 font-bold">Trusted</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
              )}

              <form onSubmit={handleComment} className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[44px] resize-none rounded-xl"
                  rows={1}
                />
                <Button type="submit" size="sm" disabled={commenting || !commentText.trim()} className="self-end rounded-xl">
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </form>
            </motion.div>
          </TabsContent>

          <TabsContent value="similar">
            <motion.div
              key="similar"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 py-3"
            >
              {similarDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No similar deals found</p>
              ) : (
                similarDeals.map((d) => <DealCard key={d.id} deal={d} />)
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <SaveRemindButton dealId={deal.id} />
          {deal.external_url && (
            <a href={deal.external_url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full rounded-xl h-11 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold gap-2 shadow-lg shadow-indigo-500/20">
                <ExternalLink className="h-4 w-4" />
                Get Deal
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
