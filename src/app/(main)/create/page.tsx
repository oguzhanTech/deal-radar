"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { PROVIDERS, CATEGORIES, COUNTRIES, CURRENCIES, TRUSTED_SUBMITTER_THRESHOLD } from "@/lib/constants";
import { Loader2, ImagePlus, CheckCircle2 } from "lucide-react";

export default function CreateDealPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [showLogin, setShowLogin] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    provider: "",
    category: "",
    country: "GLOBAL",
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
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <ImagePlus className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Create a Deal</h2>
          <p className="text-muted-foreground mb-6">Sign in to share deals with the community</p>
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

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.title || !form.provider || !form.end_at) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

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

        if (!uploadError) {
          storage_path = path;
          const { data: urlData } = supabase.storage.from("deal-images").getPublicUrl(path);
          image_url = urlData.publicUrl;
        }
      }

      const isTrusted = (profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD;

      const discount = form.original_price && form.deal_price
        ? Math.round(((parseFloat(form.original_price) - parseFloat(form.deal_price)) / parseFloat(form.original_price)) * 100)
        : null;

      const { error } = await supabase.from("deals").insert({
        title: form.title,
        description: form.description || null,
        provider: form.provider,
        category: form.category || null,
        country: form.country,
        start_at: form.start_at || null,
        end_at: form.end_at,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        deal_price: form.deal_price ? parseFloat(form.deal_price) : null,
        currency: form.currency,
        discount_percent: discount,
        image_url,
        storage_path,
        external_url: form.external_url || null,
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
    } catch {
      toast({ title: "Failed to create deal", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Deal Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          {(profile?.trust_score ?? 0) >= TRUSTED_SUBMITTER_THRESHOLD
            ? "Your deal is now live on DealRadar."
            : "Your deal is pending review. We'll notify you once it's approved."}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => { setSuccess(false); setForm({ title: "", description: "", provider: "", category: "", country: "GLOBAL", start_at: "", end_at: "", original_price: "", deal_price: "", currency: "USD", external_url: "" }); setImageFile(null); setImagePreview(null); }}>
            Create Another
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold mb-1">Create a Deal</h2>
      <p className="text-sm text-muted-foreground mb-4">Share a deal with the community</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Netflix Premium 50% Off" className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Provider *</label>
            <Select value={form.provider} onChange={(e) => update("provider", e.target.value)} placeholder="Select" options={PROVIDERS.map((p) => ({ value: p, label: p }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Select" options={CATEGORIES.map((c) => ({ value: c, label: c }))} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Country</label>
            <Select value={form.country} onChange={(e) => update("country", e.target.value)} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <Select value={form.currency} onChange={(e) => update("currency", e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input type="datetime-local" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">End Date *</label>
            <Input type="datetime-local" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Original Price</label>
            <Input type="number" step="0.01" value={form.original_price} onChange={(e) => update("original_price", e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Deal Price</label>
            <Input type="number" step="0.01" value={form.deal_price} onChange={(e) => update("deal_price", e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Image</label>
          <div className="mt-1">
            {imagePreview ? (
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 cursor-pointer">✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload an image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">External URL</label>
          <Input value={form.external_url} onChange={(e) => update("external_url", e.target.value)} placeholder="https://..." className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the deal..." className="mt-1" rows={3} />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Deal"}
        </Button>
      </form>
    </div>
  );
}
