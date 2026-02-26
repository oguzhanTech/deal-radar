"use client";

import { useState, useEffect } from "react";
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
  Copy,
  Ticket,
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
import { voteDeal, postComment, reportDeal, getUserVote } from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import { TRUSTED_SUBMITTER_THRESHOLD, LEVEL_THRESHOLDS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import type { Deal, DealComment } from "@/lib/types/database";

function getLevelLabel(level: number): string {
  return LEVEL_THRESHOLDS.find((l) => l.level === level)?.label ?? "Sessiz Takipçi";
}

interface DealDetailContentProps {
  deal: Deal;
  comments: (DealComment & { profile?: { display_name: string | null; trust_score: number; level?: number } | null })[];
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
  const router = useRouter();

  const [comments, setComments] = useState(initialComments);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [commentText, setCommentText] = useState("");
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isExpired = new Date(deal.end_at) < new Date();

  useEffect(() => {
    if (!user) return;
    getUserVote(deal.id).then((result) => {
      if (result.vote) setUserVote(result.vote);
    });
  }, [user, deal.id]);

  const handleVote = (vote: 1 | -1) => {
    requireAuth(async () => {
      if (voting) return;
      setVoting(true);
      try {
        const result = await voteDeal(deal.id, vote, userVote);
        if (result.error) {
          toast({ title: t("vote.failed"), variant: "destructive" });
        } else {
          setVoteCount((v) => v + (result.delta ?? 0));
          setUserVote(result.newVote ?? null);
        }
      } catch {
        toast({ title: t("vote.failed"), variant: "destructive" });
      }
      setVoting(false);
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      if (!commentText.trim() || commenting) return;
      setCommenting(true);
      try {
        const result = await postComment(deal.id, commentText.trim());
        if (result.error) {
          toast({ title: t("comment.failed"), variant: "destructive" });
        } else if (result.data) {
          setComments((prev) => [...prev, result.data]);
          setCommentText("");
          toast({ title: t("comment.posted") });
        }
      } catch {
        toast({ title: t("comment.failed"), variant: "destructive" });
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
        toast({ title: t("share.linkCopied") });
      }
    } catch {
      // User cancelled
    }
  };

  const handleCopyCoupon = async () => {
    if (!deal.coupon_code) return;
    await navigator.clipboard.writeText(deal.coupon_code);
    toast({ title: t("coupon.copied") });
  };

  return (
    <div className="pb-24 animate-in fade-in duration-200">
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
            <span className="text-white font-bold text-lg bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm">{t("deal.dealExpired")}</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-xl h-9 w-9 p-0"
          disabled={reporting}
          onClick={() => {
            requireAuth(async () => {
              setReporting(true);
              const reason = prompt(t("report.title"));
              if (reason) {
                const result = await reportDeal(deal.id, reason);
                if (result.error) {
                  toast({ title: t("create.error.failed"), variant: "destructive" });
                } else {
                  toast({ title: t("report.submitted") });
                }
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
                -%{deal.discount_percent}
              </Badge>
            )}
          </div>
        )}

        {/* Coupon Card */}
        {deal.coupon_code && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-200/60">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{t("coupon.title")}</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-white rounded-xl px-4 py-2.5 font-mono font-bold text-sm tracking-widest text-violet-800 border border-violet-200">
                {deal.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-100"
                onClick={handleCopyCoupon}
              >
                <Copy className="h-3.5 w-3.5" />
                {t("coupon.copy")}
              </Button>
            </div>
            {deal.coupon_description && (
              <p className="text-xs text-violet-600 mt-2">{deal.coupon_description}</p>
            )}
            {deal.coupon_expiry && (
              <p className="text-[10px] text-violet-500 mt-1">
                {t("coupon.expires")} {new Date(deal.coupon_expiry).toLocaleDateString("tr-TR")}
              </p>
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
              <span className="text-xs font-bold">{t("vote.upvote")}</span>
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
              <span className="text-xs font-bold">{t("vote.downvote")}</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl gap-1.5">
            <Share2 className="h-4 w-4" />
            {t("common.share")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={async () => {
              try {
                const res = await fetch(`/api/deals/share-card?id=${deal.id}`);
                if (!res.ok) {
                  toast({ title: t("share.cardFailed"), variant: "destructive" });
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${deal.title.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]/g, "_")}_firsat.png`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: t("share.cardDownloaded") });
              } catch {
                toast({ title: t("share.downloadFailed"), variant: "destructive" });
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground font-medium ml-auto">{saveCount} {t("deal.saves")}</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">{t("tab.details")}</TabsTrigger>
            <TabsTrigger value="comments">{t("tab.comments")} ({comments.length})</TabsTrigger>
            <TabsTrigger value="similar">{t("tab.similar")}</TabsTrigger>
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
                <p className="text-sm text-muted-foreground">{t("tab.noDescription")}</p>
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
                      {c.profile?.display_name || t("profile.anonymous")}
                    </span>
                    {c.profile && c.profile.trust_score >= TRUSTED_SUBMITTER_THRESHOLD && (
                      <Badge variant="secondary" className="text-[8px] py-0 px-1.5 font-bold">{t("profile.trusted")}</Badge>
                    )}
                    {c.profile && (c.profile as { level?: number }).level && (
                      <Badge variant="outline" className="text-[8px] py-0 px-1.5">
                        {getLevelLabel((c.profile as { level?: number }).level ?? 1)}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">{t("comment.empty")}</p>
              )}

              <form onSubmit={handleComment} className="flex gap-2 mt-4">
                <Textarea
                  placeholder={t("comment.placeholder")}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[44px] resize-none rounded-xl"
                  rows={1}
                />
                <Button type="submit" size="sm" disabled={commenting || !commentText.trim()} className="self-end rounded-xl">
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("comment.post")}
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
                <p className="text-sm text-muted-foreground text-center py-6">{t("tab.noSimilar")}</p>
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
                {t("deal.getDeal")}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
