"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  ExternalLink,
  Flag,
  Loader2,
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
  const supabase = createClient();

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
    const url = `${window.location.origin}/deal/${deal.id}`;
    if (navigator.share) {
      await navigator.share({ title: deal.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
      <AuthModal />

      {/* Hero Image */}
      <div className="relative aspect-[16/9] bg-muted">
        {deal.image_url && (
          <Image src={deal.image_url} alt={deal.title} fill className="object-cover" priority />
        )}
        {isExpired && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Expired</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="text-xs">{deal.provider}</Badge>
            <Badge variant="secondary" className="text-xs">
              {getCountryFlag(deal.country)} {deal.country}
            </Badge>
            {deal.category && <Badge variant="outline" className="text-xs">{deal.category}</Badge>}
          </div>

          <h1 className="text-xl font-bold">{deal.title}</h1>

          <div className="flex items-center gap-4">
            <DealCountdown endAt={deal.end_at} />
            <HeatBadge score={deal.heat_score} />
            <span className="text-xs text-muted-foreground">{saveCount} saves</span>
          </div>
        </div>

        {/* Price */}
        {deal.deal_price != null && (
          <div className="flex items-center gap-3">
            {deal.original_price != null && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(deal.original_price, deal.currency)}
              </span>
            )}
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(deal.deal_price, deal.currency)}
            </span>
            {deal.discount_percent && (
              <Badge className="bg-green-500 text-white border-0 text-sm">
                -{deal.discount_percent}%
              </Badge>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <SaveRemindButton dealId={deal.id} />

          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => handleVote(1)}
              disabled={voting}
              className={`p-2 transition cursor-pointer ${userVote === 1 ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-semibold tabular-nums min-w-[28px] text-center">
              {voteCount}
            </span>
            <button
              onClick={() => handleVote(-1)}
              disabled={voting}
              className={`p-2 transition cursor-pointer ${userVote === -1 ? "bg-destructive/10 text-destructive" : "hover:bg-muted"}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          {deal.external_url && (
            <a href={deal.external_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
                Get Deal
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto"
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

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="prose prose-sm max-w-none py-2">
              {deal.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <div className="space-y-3 py-2">
              {comments.map((c) => (
                <div key={c.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {c.profile?.display_name || "User"}
                    </span>
                    {c.profile && c.profile.trust_score >= TRUSTED_SUBMITTER_THRESHOLD && (
                      <Badge variant="secondary" className="text-[10px] py-0">Trusted</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
              )}

              <form onSubmit={handleComment} className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[44px] resize-none"
                  rows={1}
                />
                <Button type="submit" size="sm" disabled={commenting || !commentText.trim()} className="self-end">
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="similar">
            <div className="space-y-3 py-2">
              {similarDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No similar deals found</p>
              ) : (
                similarDeals.map((d) => <DealCard key={d.id} deal={d} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
