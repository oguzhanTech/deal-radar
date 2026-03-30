"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
  User2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DealCountdown } from "@/components/deals/deal-countdown";
import { HeatBadge } from "@/components/deals/heat-badge";
import { SaveRemindButton } from "@/components/deals/save-remind-button";
import { DealCard } from "@/components/deals/deal-card";
import { openPublicProfileModal } from "@/components/profile/public-user-profile-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useAuthGuard } from "@/components/auth/auth-guard";
import { useToast } from "@/components/ui/toast";
import { voteDeal, postComment, reportDeal, getUserVote } from "@/app/actions";
import { hasStrikethroughOriginal } from "@/lib/deal-price";
import { formatPrice } from "@/lib/utils";
import { TRUSTED_SUBMITTER_THRESHOLD, LEVEL_THRESHOLDS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import type { Deal, DealComment } from "@/lib/types/database";

function getLevelLabel(level: number): string {
  return LEVEL_THRESHOLDS.find((l) => l.level === level)?.label ?? "Sessiz Takipçi";
}

const ENABLE_DEAL_DOWNLOAD = false;

/** Comment with profile limited to what the UI uses (no full Profile required) */
type DealCommentWithProfile = Omit<DealComment, "profile"> & {
  profile?: { display_name: string | null; trust_score: number; level?: number; profile_image_url?: string | null } | null;
};

interface DealDetailContentProps {
  deal: Deal;
  creatorName?: string | null;
  comments: DealCommentWithProfile[];
  voteCount: number;
  saveCount: number;
  similarDeals: Deal[];
}

export function DealDetailContent({
  deal,
  creatorName,
  comments: initialComments,
  voteCount: initialVoteCount,
  saveCount,
  similarDeals,
}: DealDetailContentProps) {
  const { user, profile } = useAuth();
  const { requireAuth, AuthModal } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [comments, setComments] = useState(initialComments);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToDisplayName, setReplyToDisplayName] = useState<string>("");
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [tab, setTab] = useState<"details" | "comments" | "similar">(
    searchParams.get("tab") === "comments" ? "comments" : "details"
  );

  const isExpired = new Date(deal.end_at) < new Date();
  const creator =
    creatorName ?? t("admin.users.unnamed");
  const focusedCommentId = searchParams.get("comment");

  const showStrikeOnDetail = hasStrikethroughOriginal(deal.original_price, deal.deal_price);
  const showDiscountBadgeOnDetail = !!deal.discount_percent && showStrikeOnDetail;

  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.parent_comment_id),
    [comments]
  );
  const repliesByParent = useMemo(() => {
    const map = new Map<string, DealCommentWithProfile[]>();
    for (const comment of comments) {
      if (!comment.parent_comment_id) continue;
      const list = map.get(comment.parent_comment_id) ?? [];
      list.push(comment);
      map.set(comment.parent_comment_id, list);
    }
    return map;
  }, [comments]);

  useEffect(() => {
    const next = searchParams.get("tab") === "comments" ? "comments" : "details";
    setTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;
    getUserVote(deal.id).then((result) => {
      if (result.vote) setUserVote(result.vote);
    });
  }, [user?.id, deal.id]);

  const handleVote = (vote: 1 | -1) => {
    requireAuth(async () => {
      if (voting) return;
      const prevVote = userVote;
      const prevCount = voteCount;
      const nextVote = prevVote === vote ? null : vote;
      const delta = (nextVote ?? 0) - (prevVote ?? 0);
      setVoteCount((c) => c + delta);
      setUserVote(nextVote);
      setVoting(true);
      try {
        const result = await voteDeal(deal.id, vote, prevVote);
        if (result.error) {
          setVoteCount(prevCount);
          setUserVote(prevVote);
          toast({ title: t("vote.failed"), variant: "destructive" });
        }
      } catch {
        setVoteCount(prevCount);
        setUserVote(prevVote);
        toast({ title: t("vote.failed"), variant: "destructive" });
      } finally {
        setVoting(false);
      }
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      if (!commentText.trim() || commenting) return;
      const text = commentText.trim();
      setCommentText("");
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = {
        id: tempId,
        deal_id: deal.id,
        user_id: user!.id,
        parent_comment_id: replyToCommentId,
        content: text,
        created_at: new Date().toISOString(),
        profile: {
          display_name: profile?.display_name ?? null,
          trust_score: profile?.trust_score ?? 0,
          level: profile?.level ?? 1,
          profile_image_url: profile?.profile_image_url ?? null,
        },
      } as (typeof comments)[number];
      setComments((prev) => [...prev, optimisticComment]);
      setCommenting(true);
      try {
        const result = await postComment(deal.id, text, replyToCommentId);
        if (result.error) {
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          toast({ title: t("comment.failed"), variant: "destructive" });
        } else if (result.data) {
          setComments((prev) => prev.map((c) => (c.id === tempId ? result.data : c)));
          toast({ title: t("comment.posted") });
          setReplyToCommentId(null);
          setReplyToDisplayName("");
        }
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        toast({ title: t("comment.failed"), variant: "destructive" });
      }
      setCommenting(false);
    });
  };

  useEffect(() => {
    if (!focusedCommentId || tab !== "comments") return;
    const id = `comment-${focusedCommentId}`;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/50");
    const timer = setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/50");
    }, 1800);
    return () => clearTimeout(timer);
  }, [focusedCommentId, tab, comments]);

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
    <div className="pb-28 animate-in fade-in duration-200 lg:pb-10">
      <AuthModal />

      {/* Hero Image — full-bleed square on mobile; constrained card on desktop */}
      <div
        className={
          "relative bg-muted aspect-square w-full overflow-hidden " +
          "lg:aspect-auto lg:h-[min(22rem,42vh)] lg:max-h-[min(22rem,42vh)] lg:max-w-2xl lg:mx-auto lg:rounded-2xl lg:shadow-sm lg:ring-1 lg:ring-border/60"
        }
      >
        {deal.image_url && (
          <Image
            src={deal.image_url}
            alt={deal.title}
            fill
            className="object-cover lg:object-contain lg:bg-muted"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none lg:from-black/25" />

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
      <div className="px-4 pt-4 space-y-4 lg:max-w-3xl lg:mx-auto lg:px-6 lg:pt-6">
        {/* Creator + Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User2 className="h-3.5 w-3.5 text-muted-foreground/80" />
            <button
              type="button"
              className="font-medium truncate max-w-[160px] hover:text-foreground transition cursor-pointer"
              onClick={() => openPublicProfileModal(deal.created_by)}
            >
              {creator}
            </button>
          </div>
          <Badge className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold">
            {deal.category || deal.provider}
          </Badge>
          <HeatBadge score={deal.heat_score} forceTrending={!!deal.is_trending} />
        </div>

        <h1 className="text-xl font-extrabold leading-tight">{deal.title}</h1>

        <DealCountdown endAt={deal.end_at} />

        {/* Price Card */}
        {deal.deal_price != null && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              {showStrikeOnDetail && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(deal.original_price!, deal.currency)}
                </p>
              )}
              <p className="text-2xl font-extrabold text-emerald-600">
                {formatPrice(deal.deal_price, deal.currency)}
              </p>
            </div>
            {showDiscountBadgeOnDetail && (
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

          {ENABLE_DEAL_DOWNLOAD && (
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
          )}

          <span className="text-xs text-muted-foreground font-medium ml-auto">{saveCount} {t("deal.saves")}</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="details">{t("tab.details")}</TabsTrigger>
            <TabsTrigger value="comments">{t("tab.comments")} ({comments.length})</TabsTrigger>
            <TabsTrigger value="similar">{t("tab.similar")}</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="py-3">
              {deal.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{deal.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("tab.noDescription")}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <div className="space-y-3 py-3">
              {topLevelComments.map((c) => (
                <div key={c.id} id={`comment-${c.id}`} className="bg-card rounded-2xl p-3.5 shadow-card space-y-1.5 transition">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 rounded-lg">
                      <AvatarImage
                        src={c.profile?.profile_image_url ?? undefined}
                        alt={c.profile?.display_name ?? "Avatar"}
                        className="rounded-lg object-cover"
                      />
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-[10px] font-bold text-indigo-600">
                        {c.profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="text-sm font-semibold hover:text-primary transition cursor-pointer"
                      onClick={() => openPublicProfileModal(c.user_id)}
                    >
                      {c.profile?.display_name || t("profile.anonymous")}
                    </button>
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
                  <button
                    type="button"
                    className="text-[11px] text-primary font-medium hover:underline cursor-pointer"
                    onClick={() => {
                      setReplyToCommentId(c.id);
                      setReplyToDisplayName(c.profile?.display_name || t("profile.anonymous"));
                    }}
                  >
                    Yanıtla
                  </button>

                  {(repliesByParent.get(c.id) ?? []).map((r) => (
                    <div
                      key={r.id}
                      id={`comment-${r.id}`}
                      className="ml-6 mt-2 rounded-xl border border-border/60 bg-muted/40 p-2.5 space-y-1 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-md">
                          <AvatarImage
                            src={r.profile?.profile_image_url ?? undefined}
                            alt={r.profile?.display_name ?? "Avatar"}
                            className="rounded-md object-cover"
                          />
                          <AvatarFallback className="rounded-md bg-gradient-to-br from-indigo-100 to-violet-100 text-[10px] font-bold text-indigo-600">
                            {r.profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          className="text-xs font-semibold hover:text-primary transition cursor-pointer"
                          onClick={() => openPublicProfileModal(r.user_id)}
                        >
                          {r.profile?.display_name || t("profile.anonymous")}
                        </button>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{r.content}</p>
                    </div>
                  ))}
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">{t("comment.empty")}</p>
              )}

              <form onSubmit={handleComment} className="flex gap-2 mt-4">
                <div className="flex-1">
                  {replyToCommentId && (
                    <div className="mb-1.5 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2 py-1">
                      <p className="text-[11px] text-primary">
                        @{replyToDisplayName} kullanıcısına yanıt yazıyorsun
                      </p>
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                          setReplyToCommentId(null);
                          setReplyToDisplayName("");
                        }}
                      >
                        İptal
                      </button>
                    </div>
                  )}
                  <Textarea
                    placeholder={replyToCommentId ? "Yanıtını yaz..." : t("comment.placeholder")}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[44px] resize-none rounded-xl"
                    rows={1}
                  />
                </div>
                <Button type="submit" size="sm" disabled={commenting || !commentText.trim()} className="self-end rounded-xl">
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("comment.post")}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="similar">
            <div className="space-y-3 py-3">
              {similarDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("tab.noSimilar")}</p>
              ) : (
                similarDeals.map((d) => <DealCard key={d.id} deal={d} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Bottom Action Bar - above bottom nav with gap (nav h-16, gap 3) */}
      <div className="fixed left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border" style={{ bottom: "calc(4rem + 12px)" }}>
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg lg:max-w-7xl mx-auto w-full pb-safe">
          <SaveRemindButton dealId={deal.id} compact className="h-11 w-11 shrink-0 rounded-xl border border-border bg-muted/80 hover:bg-muted !p-0 flex items-center justify-center" />
          {deal.external_url && (
            <a href={deal.external_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
              <span className="flex items-center justify-center gap-2 w-full rounded-xl h-11 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{t("deal.getDeal")}</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
