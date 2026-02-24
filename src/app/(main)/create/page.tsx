"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { PROVIDERS, CATEGORIES, COUNTRIES, CURRENCIES, TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import { Loader2, ImagePlus, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

export default function CreateDealPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    provider: "",
    category: "",
    country: profile?.country || "GLOBAL",
    start_at: "",
    end_at: "",
    original_price: "",
    deal_price: "",
    currency: "USD",
    external_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
          <h2 className="text-2xl font-bold mb-2">Create a Deal</h2>
          <p className="text-muted-foreground mb-8 text-sm">Sign in to share deals with the community</p>
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

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return false;
    }
    if (!form.provider || !form.provider.trim()) {
      toast({ title: "Provider is required", variant: "destructive" });
      return false;
    }
    if (!form.end_at) {
      toast({ title: "End date is required", variant: "destructive" });
      return false;
    }
    const endDate = new Date(form.end_at);
    if (isNaN(endDate.getTime())) {
      toast({ title: "Invalid end date format", variant: "destructive" });
      return false;
    }
    if (endDate <= new Date()) {
      toast({ title: "End date must be in the future", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep1()) return;

    setSubmitting(true);
    try {
      let image_url = null;
      let storage_path = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("deal-images")
          .upload(path, imageFile);

        if (uploadError) {
          toast({ title: "Image upload failed", description: uploadError.message, variant: "destructive" });
          setSubmitting(false);
          return;
        }

        storage_path = path;
        const { data: urlData } = supabase.storage.from("deal-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const isTrusted = (profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD;

      const discount = form.original_price && form.deal_price
        ? Math.round(((parseFloat(form.original_price) - parseFloat(form.deal_price)) / parseFloat(form.original_price)) * 100)
        : null;

      const endAtISO = new Date(form.end_at).toISOString();
      const startAtISO = form.start_at ? new Date(form.start_at).toISOString() : null;

      const { error } = await supabase.from("deals").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        provider: form.provider.trim(),
        category: form.category || null,
        country: form.country,
        start_at: startAtISO,
        end_at: endAtISO,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        deal_price: form.deal_price ? parseFloat(form.deal_price) : null,
        currency: form.currency,
        discount_percent: discount,
        image_url,
        storage_path,
        external_url: form.external_url.trim() || null,
        created_by: user.id,
        status: isTrusted ? "approved" : "pending",
      });

      if (error) {
        console.error("Create deal error:", error);
        throw error;
      }

      setSuccess(true);
      toast({
        title: isTrusted ? "Deal published!" : "Deal submitted for review!",
        description: isTrusted ? "Your deal is now live" : "An admin will review it shortly",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Unknown error";
      toast({ title: "Failed to create deal", description: message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-5"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Deal Submitted!</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          {(profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD
            ? "Your deal is now live on DealRadar."
            : "Your deal is pending review. We'll notify you once it's approved."}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setForm({ title: "", description: "", provider: "", category: "", country: profile?.country || "GLOBAL", start_at: "", end_at: "", original_price: "", deal_price: "", currency: "USD", external_url: "" });
              setImageFile(null);
              setImagePreview(null);
            }}
            variant="outline"
            className="rounded-xl"
          >
            Create Another
          </Button>
          <Button onClick={() => router.push("/")} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

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
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-extrabold">Quick Submission</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Just 5 fields to get started</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Image</label>
              {imagePreview ? (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted shadow-card">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs cursor-pointer">✕</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all active:scale-[0.98]">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium text-muted-foreground">Tap to upload</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title *</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Netflix Premium 50% Off" className="rounded-xl h-12" />
            </div>

            {/* Provider */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Provider *</label>
              <Select value={form.provider} onChange={(e) => update("provider", e.target.value)} placeholder="Select provider" options={PROVIDERS.map((p) => ({ value: p, label: p }))} className="rounded-xl h-12" />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">End Date & Time *</label>
              <Input type="datetime-local" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className="rounded-xl h-12" />
            </div>

            {/* Country */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Country</label>
              <Select value={form.country} onChange={(e) => update("country", e.target.value)} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} className="rounded-xl h-12" />
            </div>

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
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Publish Now</>}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-extrabold">Advanced Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Optional — add more info for a better listing</p>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Start Date</label>
              <Input type="datetime-local" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className="rounded-xl h-12" />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
              <Select value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Select category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} className="rounded-xl h-12" />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Original Price</label>
                <Input type="number" step="0.01" value={form.original_price} onChange={(e) => update("original_price", e.target.value)} placeholder="0.00" className="rounded-xl h-12" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Deal Price</label>
                <Input type="number" step="0.01" value={form.deal_price} onChange={(e) => update("deal_price", e.target.value)} placeholder="0.00" className="rounded-xl h-12" />
              </div>
            </div>

            {form.original_price && form.deal_price && (
              <div className="bg-emerald-50 rounded-xl px-4 py-2.5 text-center">
                <span className="text-xs text-muted-foreground">Discount: </span>
                <span className="text-sm font-extrabold text-emerald-600">
                  {Math.round(((parseFloat(form.original_price) - parseFloat(form.deal_price)) / parseFloat(form.original_price)) * 100)}% off
                </span>
              </div>
            )}

            {/* Currency */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Currency</label>
              <Select value={form.currency} onChange={(e) => update("currency", e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} className="rounded-xl h-12" />
            </div>

            {/* External URL */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">External URL</label>
              <Input value={form.external_url} onChange={(e) => update("external_url", e.target.value)} placeholder="https://..." className="rounded-xl h-12" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the deal..." className="rounded-xl" rows={3} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl h-12 gap-2" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Publish Deal</>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
