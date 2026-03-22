"use client";

import { useState, useRef } from "react";
import type { MouseEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createDeal, uploadDealImage } from "@/app/actions";
import { DEAL_CATEGORIES, CURRENCIES, TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import { hasStrikethroughOriginal } from "@/lib/deal-price";
import { formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  Loader2,
  ImagePlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Ticket,
  Tag,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const IMAGE_ZOOM_MIN = 1;
const IMAGE_ZOOM_MAX = 3;
const IMAGE_ZOOM_STEP = 0.25;

function parsePriceInput(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export default function CreateDealPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    start_at: "",
    end_at: "",
    original_price: "",
    deal_price: "",
    currency: "TL",
    external_url: "",
    hasCoupon: false,
    couponCode: "",
    couponDescription: "",
    couponExpiry: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFocusX, setImageFocusX] = useState(0.5); // 0-1 yatay odak
  const [imageFocusY, setImageFocusY] = useState(0.5); // 0-1 dikey odak
  const [imageZoom, setImageZoom] = useState(1);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartFocusX, setDragStartFocusX] = useState(0.5);
  const [dragStartFocusY, setDragStartFocusY] = useState(0.5);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [endDateUnknown, setEndDateUnknown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!authLoading && !user) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5">
            <ImagePlus className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("create.title")}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{t("create.signInDesc")}</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            {t("common.signIn")}
          </button>
        </div>
      </>
    );
  }

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleTitleChange = (value: string) => {
    const trimmedStart = value.replace(/^\s+/, "");
    if (!trimmedStart) {
      update("title", "");
      return;
    }
    const first = trimmedStart.charAt(0).toUpperCase();
    const rest = trimmedStart.slice(1);
    update("title", first + rest);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif =
      file.type === "image/gif" ||
      file.name.toLowerCase().endsWith(".gif");
    if (isGif) {
      // GIF desteği yok; kullanıcıyı uyar ve dosyayı sıfırla
      toast({
        title: "GIF desteklenmiyor",
        description: "Lütfen JPG veya PNG formatında bir görsel yükleyin.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageFocusX(0.5);
    setImageFocusY(0.5);
    setImageZoom(1);
  };

  const getTouchDistance = (e: TouchEvent) => {
    if (e.touches.length < 2) return null;
    const a = e.touches[0];
    const b = e.touches[1];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  };

  const handleImageTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!imagePreview) return;
    const dist = getTouchDistance(e);
    if (dist !== null) {
      e.preventDefault();
      pinchStartRef.current = { distance: dist, zoom: imageZoom };
    } else {
      handleImageDragStart(e);
    }
  };

  const handleImageTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!imagePreview) return;
    const dist = getTouchDistance(e);
    if (dist !== null && pinchStartRef.current) {
      e.preventDefault();
      const { distance, zoom } = pinchStartRef.current;
      const next = Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, zoom * (dist / distance)));
      setImageZoom(next);
    } else {
      handleImageDragMove(e);
    }
  };

  const handleImageTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchStartRef.current = null;
    if (e.touches.length === 0) handleImageDragEnd();
  };

  const handleImageDragStart = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!imagePreview) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    e.preventDefault();
    setDragStartX(clientX);
    setDragStartY(clientY);
    setDragStartFocusX(imageFocusX);
    setDragStartFocusY(imageFocusY);
  };

  const handleImageDragMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (dragStartX == null || dragStartY == null || !imagePreview) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const sens = 300; // px başına 0-1 aralığı; ters yön: sürüklediğin yönde içerik kayar
    const nextX = Math.min(1, Math.max(0, dragStartFocusX - (clientX - dragStartX) / sens));
    const nextY = Math.min(1, Math.max(0, dragStartFocusY - (clientY - dragStartY) / sens));
    setImageFocusX(nextX);
    setImageFocusY(nextY);
  };

  const handleImageDragEnd = () => {
    setDragStartX(null);
    setDragStartY(null);
  };

  const validateStep1 = () => {
    if (!form.title.trim()) {
      toast({ title: t("create.error.title"), variant: "destructive" });
      return false;
    }
    if (form.title.trim().length < 5) {
      toast({ title: t("create.error.titleMin"), variant: "destructive" });
      return false;
    }
    if (!form.category || !form.category.trim()) {
      toast({ title: t("create.error.category"), variant: "destructive" });
      return false;
    }
    if (!endDateUnknown) {
      if (!form.end_at) {
        toast({ title: t("create.error.endDate"), variant: "destructive" });
        return false;
      }
      const endDate = new Date(form.end_at);
      if (isNaN(endDate.getTime())) {
        toast({ title: t("create.error.endDateInvalid"), variant: "destructive" });
        return false;
      }
      if (endDate <= new Date()) {
        toast({ title: t("create.error.endDateFuture"), variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (form.hasCoupon && form.couponCode.length > 30) {
      toast({ title: t("create.error.couponMax"), variant: "destructive" });
      return false;
    }
    if (form.external_url.trim() && !/^https?:\/\/.+/.test(form.external_url.trim())) {
      toast({ title: t("create.error.urlInvalid"), variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep1()) return;

    setSubmitting(true);

    try {
      let image_url: string | null = null;
      let storage_path: string | null = null;

      if (imageFile) {
        let fileToUpload: File = imageFile;
        try {
          fileToUpload = await cropImageForDeal(imageFile, imageFocusX, imageFocusY, imageZoom);
        } catch {
          // Cropping failed, continue with original file
        }
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadResult = await uploadDealImage(formData);
        if (uploadResult.error) {
          toast({ title: t("create.error.imageFailed"), description: uploadResult.error, variant: "destructive" });
          return;
        }
        image_url = uploadResult.url ?? null;
        storage_path = uploadResult.path ?? null;
      }

      const isTrusted = (profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD;

      const discount = form.original_price && form.deal_price
        ? Math.round(((parseFloat(form.original_price) - parseFloat(form.deal_price)) / parseFloat(form.original_price)) * 100)
        : null;

      const endAtISO = endDateUnknown
        ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(form.end_at).toISOString();
      const startAtISO = form.start_at ? new Date(form.start_at).toISOString() : null;

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        provider: "—",
        category: form.category.trim(),
        start_at: startAtISO,
        end_at: endAtISO,
        ...(endDateUnknown ? { end_date_unknown: true } : {}),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        deal_price: form.deal_price ? parseFloat(form.deal_price) : null,
        currency: form.currency,
        discount_percent: discount,
        image_url,
        storage_path,
        external_url: form.external_url.trim() || null,
        status: isTrusted ? "approved" : "pending",
      };

      if (form.hasCoupon && form.couponCode.trim()) {
        payload.coupon_code = form.couponCode.trim();
        payload.coupon_description = form.couponDescription.trim() || null;
        payload.coupon_expiry = form.couponExpiry ? new Date(form.couponExpiry).toISOString() : null;
      }

      const result = await createDeal(payload);

      if (result.error) {
        toast({ title: t("create.error.failed"), description: result.error, variant: "destructive" });
        return;
      }

      setSuccess(true);
      toast({
        title: isTrusted ? t("create.success.toastLive") : t("create.success.toastPending"),
        description: isTrusted ? t("create.success.toastLiveDesc") : t("create.success.toastPendingDesc"),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Beklenmeyen hata";
      toast({ title: t("create.error.failed"), description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-5 animate-[scale-in_0.3s_ease-out]">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("create.success.title")}</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          {(profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD
            ? t("create.success.live")
            : t("create.success.pending")}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setForm({ title: "", description: "", category: "", start_at: "", end_at: "", original_price: "", deal_price: "", currency: "TL", external_url: "", hasCoupon: false, couponCode: "", couponDescription: "", couponExpiry: "" });
              setEndDateUnknown(false);
              setImageFile(null);
              setImagePreview(null);
            }}
            variant="outline"
            className="rounded-xl"
          >
            {t("create.action.createAnother")}
          </Button>
          <Button onClick={() => router.push("/")} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600">
            {t("create.action.goHome")}
          </Button>
        </div>
      </div>
    );
  }

  const computedDiscount = form.original_price && form.deal_price
    ? Math.round(((parseFloat(form.original_price) - parseFloat(form.deal_price)) / parseFloat(form.original_price)) * 100)
    : null;

  const showDualPriceInReview = hasStrikethroughOriginal(
    parsePriceInput(form.original_price),
    parsePriceInput(form.deal_price)
  );

  return (
    <div className="py-5 px-4">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full bg-primary transition-all duration-500 ${step >= 2 ? "w-full" : "w-0"}`} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full bg-primary transition-all duration-500 ${step >= 3 ? "w-full" : "w-0"}`} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
        </div>
      </div>

      <div>
        {step === 1 && (
          <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
            <div>
              <h2 className="text-xl font-extrabold">{t("create.step1.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("create.step1.desc")}</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.image")}</label>
              {imagePreview ? (
                <div className="space-y-1.5">
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-card select-none cursor-grab active:cursor-grabbing touch-none"
                    onMouseDown={handleImageDragStart}
                    onMouseMove={handleImageDragMove}
                    onMouseUp={handleImageDragEnd}
                    onMouseLeave={handleImageDragEnd}
                    onTouchStart={handleImageTouchStart}
                    onTouchMove={handleImageTouchMove}
                    onTouchEnd={handleImageTouchEnd}
                    style={{ touchAction: "none" }}
                  >
                    <div
                      className="absolute inset-0 origin-center pointer-events-none"
                      style={{
                        transform: `scale(${imageZoom}) translate(${(0.5 - imageFocusX) * Math.max(0, imageZoom - 1) * 100}%, ${(0.5 - imageFocusY) * Math.max(0, imageZoom - 1) * 100}%)`,
                        transformOrigin: "50% 50%",
                      }}
                    >
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        style={{ objectPosition: `${imageFocusX * 100}% ${imageFocusY * 100}%` }}
                      />
                    </div>
                    {/* Zoom controls - desktop; wrapper pointer-events-none so drag works over the bar, only buttons capture */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-xl px-1.5 py-1 pointer-events-none">
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.max(IMAGE_ZOOM_MIN, z - IMAGE_ZOOM_STEP))}
                        disabled={imageZoom <= IMAGE_ZOOM_MIN}
                        className="p-1.5 rounded-lg text-white hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer pointer-events-auto"
                        aria-label="Uzaklaştır"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-[10px] font-medium text-white min-w-[2.5rem] text-center">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.min(IMAGE_ZOOM_MAX, z + IMAGE_ZOOM_STEP))}
                        disabled={imageZoom >= IMAGE_ZOOM_MAX}
                        className="p-1.5 rounded-lg text-white hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer pointer-events-auto"
                        aria-label="Yakınlaştır"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Sürükleyerek konum, iki parmakla pinch ile zoom. Masaüstünde alttaki +/− ile yakınlaştırıp uzaklaştırabilirsin.
                  </p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all active:scale-[0.98]">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium text-muted-foreground">{t("create.field.imageTap")}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.title")}</label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t("create.field.titlePlaceholder")}
                className="rounded-xl h-12"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.category")}</label>
              <Select value={form.category} onChange={(e) => update("category", e.target.value)} placeholder={t("create.field.categoryPlaceholder")} options={DEAL_CATEGORIES.map((c) => ({ value: c, label: c }))} className="rounded-xl h-12" />
            </div>

            {/* End date unknown checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="endDateUnknown"
                checked={endDateUnknown}
                onChange={(e) => setEndDateUnknown(e.target.checked)}
                className="mt-1.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="endDateUnknown" className="text-sm text-muted-foreground cursor-pointer">
                {t("create.field.endDateUnknown")}
              </label>
            </div>
            {endDateUnknown && (
              <p className="text-[10px] text-muted-foreground">{t("create.field.endDateUnknownHint")}</p>
            )}

            {/* End Date */}
            {!endDateUnknown && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.endDate")}</label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className="rounded-xl h-12" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-12 gap-2"
                disabled={submitting}
                onClick={() => {
                  if (validateStep1()) handleSubmit();
                }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> {t("create.action.publishNow")}</>}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
              >
                {t("common.continue")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
            <div>
              <h2 className="text-xl font-extrabold">{t("create.step2.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("create.step2.desc")}</p>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.startDate")}</label>
              <Input type="datetime-local" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className="rounded-xl h-12" />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.originalPrice")}</label>
                <Input type="number" step="0.01" value={form.original_price} onChange={(e) => update("original_price", e.target.value)} placeholder="0.00" className="rounded-xl h-12" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.dealPrice")}</label>
                <Input type="number" step="0.01" value={form.deal_price} onChange={(e) => update("deal_price", e.target.value)} placeholder="0.00" className="rounded-xl h-12" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug -mt-1">{t("create.field.priceHint")}</p>

            {computedDiscount !== null && computedDiscount > 0 && (
              <div className="bg-emerald-50 rounded-xl px-4 py-2.5 text-center">
                <span className="text-xs text-muted-foreground">{t("deal.discount")}: </span>
                <span className="text-sm font-extrabold text-emerald-600">
                  %{computedDiscount}
                </span>
              </div>
            )}

            {/* Currency */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.currency")}</label>
              <Select value={form.currency} onChange={(e) => update("currency", e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} className="rounded-xl h-12" />
            </div>

            {/* External URL */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.externalUrl")}</label>
              <Input value={form.external_url} onChange={(e) => update("external_url", e.target.value)} placeholder="https://..." className="rounded-xl h-12" />
            </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.field.description")}</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={t("create.field.descriptionPlaceholder")}
                  className="rounded-xl font-normal whitespace-pre-wrap"
                  rows={4}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Satır sonları ve • madde işaretleri detay sayfasında aynı şekilde gösterilir.
                </p>
              </div>

            {/* Coupon Toggle */}
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <button
                type="button"
                onClick={() => update("hasCoupon", !form.hasCoupon)}
                className="flex items-center justify-between w-full cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">{t("create.coupon.toggle")}</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${form.hasCoupon ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.hasCoupon ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>

              <div>
                {form.hasCoupon && (
                  <div className="space-y-3 animate-[fade-in_0.2s_ease-out]">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.coupon.code")}</label>
                      <Input value={form.couponCode} onChange={(e) => update("couponCode", e.target.value)} placeholder={t("create.coupon.codePlaceholder")} maxLength={30} className="rounded-xl h-12 font-mono tracking-wider" />
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.couponCode.length}/30</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.coupon.description")}</label>
                      <Input value={form.couponDescription} onChange={(e) => update("couponDescription", e.target.value)} placeholder={t("create.coupon.descriptionPlaceholder")} className="rounded-xl h-12" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("create.coupon.expiry")}</label>
                      <Input type="datetime-local" value={form.couponExpiry} onChange={(e) => update("couponExpiry", e.target.value)} className="rounded-xl h-12" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl h-12 gap-2" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> {t("common.back")}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
              >
                {t("common.continue")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
            <div>
              <h2 className="text-xl font-extrabold">{t("create.step3.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("create.step3.desc")}</p>
            </div>

            {/* Summary Card */}
            <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
              {/* Image preview */}
              {imagePreview && (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <div
                    className="absolute inset-0 origin-center"
                    style={{
                      transform: `scale(${imageZoom}) translate(${(0.5 - imageFocusX) * Math.max(0, imageZoom - 1) * 100}%, ${(0.5 - imageFocusY) * Math.max(0, imageZoom - 1) * 100}%)`,
                      transformOrigin: "50% 50%",
                    }}
                  >
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      style={{ objectPosition: `${imageFocusX * 100}% ${imageFocusY * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Title + Category */}
              <div>
                <h3 className="font-bold text-lg leading-tight">{form.title || "—"}</h3>
                <p className="text-sm text-muted-foreground mt-1">{form.category || "—"}</p>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("create.review.price")}</p>
                  {form.deal_price ? (
                    <div className="flex items-center gap-2">
                      {showDualPriceInReview && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(parseFloat(form.original_price), form.currency)}
                        </span>
                      )}
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatPrice(parseFloat(form.deal_price), form.currency)}
                      </span>
                      {computedDiscount !== null && computedDiscount > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          %{computedDiscount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("create.review.noPrice")}</span>
                  )}
                </div>
              </div>

              {/* Coupon */}
              <div className="flex items-center gap-3">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("create.review.coupon")}</p>
                  {form.hasCoupon && form.couponCode ? (
                    <div>
                      <span className="font-mono font-bold text-sm tracking-wider bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
                        {form.couponCode}
                      </span>
                      {form.couponDescription && (
                        <p className="text-xs text-muted-foreground mt-0.5">{form.couponDescription}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("create.review.noCoupon")}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {form.description && (
                <p className="text-sm text-muted-foreground border-t pt-3 whitespace-pre-wrap">
                  {form.description}
                </p>
              )}

              {/* URL */}
              {form.external_url && (
                <p className="text-xs text-primary truncate">{form.external_url}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl h-12 gap-2" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" /> {t("common.back")}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> {t("create.action.publish")}</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function cropImageForDeal(file: File, focusX: number, focusY: number, zoom: number = 1): Promise<File> {
  if (typeof window === "undefined" || typeof window.Image === "undefined") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = objectUrl;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return file;

    const zoomFactor = Math.max(1, zoom);
    const cropSize = Math.min(width, height) / zoomFactor;
    const centerX = focusX * width;
    const centerY = focusY * height;
    let offsetX = centerX - cropSize / 2;
    let offsetY = centerY - cropSize / 2;
    offsetX = Math.max(0, Math.min(width - cropSize, offsetX));
    offsetY = Math.max(0, Math.min(height - cropSize, offsetY));

    const outputSize = 1280;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || file),
        "image/jpeg",
        0.9
      );
    });

    if (blob instanceof File) return blob;
    return new File([blob], file.name.replace(/\.\w+$/, "") + "-cropped.jpg", {
      type: "image/jpeg",
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

