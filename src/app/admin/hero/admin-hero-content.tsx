"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminUpsertHeroAnnouncement, adminDeleteHeroAnnouncement, uploadDealImage } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { Trash2, Loader2, Pencil, Plus } from "lucide-react";
import type { HeroAnnouncement } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface AdminHeroContentProps {
  initialAnnouncements: HeroAnnouncement[];
}

export function AdminHeroContent({ initialAnnouncements }: AdminHeroContentProps) {
  const [rows, setRows] = useState(initialAnnouncements);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    link_url: "",
    sort_order: "0",
    is_active: true,
    image_url: "",
    image_storage_path: "" as string | null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setForm({
      title: "",
      body: "",
      link_url: "",
      sort_order: "0",
      is_active: true,
      image_url: "",
      image_storage_path: null,
    });
    setImageFile(null);
    setEditingId(null);
  };

  const startNew = () => {
    resetForm();
    setEditingId("new");
  };

  const startEdit = (a: HeroAnnouncement) => {
    setForm({
      title: a.title,
      body: a.body ?? "",
      link_url: a.link_url ?? "",
      sort_order: String(a.sort_order),
      is_active: a.is_active,
      image_url: a.image_url,
      image_storage_path: a.image_storage_path,
    });
    setImageFile(null);
    setEditingId(a.id);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t("admin.toast.error"), description: t("admin.hero.titleRequired"), variant: "destructive" });
      return;
    }

    let imageUrl = form.image_url;
    let storagePath = form.image_storage_path;

    if (imageFile) {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", imageFile);
      const up = await uploadDealImage(fd);
      setLoading(false);
      if (up.error || !up.url) {
        toast({ title: t("admin.toast.error"), description: up.error ?? "Upload failed", variant: "destructive" });
        return;
      }
      imageUrl = up.url;
      storagePath = up.path ?? null;
    }

    if (!imageUrl.trim()) {
      toast({ title: t("admin.toast.error"), description: t("admin.hero.imageRequired"), variant: "destructive" });
      return;
    }

    setLoading(true);
    const isNew = editingId === "new";
    const { error } = await adminUpsertHeroAnnouncement({
      id: isNew ? undefined : editingId ?? undefined,
      title: form.title,
      body: form.body || null,
      image_url: imageUrl,
      image_storage_path: storagePath,
      link_url: form.link_url || null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
    });
    setLoading(false);

    if (error) {
      toast({ title: t("admin.toast.error"), description: error, variant: "destructive" });
      return;
    }

    toast({ title: t("admin.toast.saved") });
    if (isNew) {
      resetForm();
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                title: form.title.trim(),
                body: form.body.trim() || null,
                image_url: imageUrl,
                image_storage_path: storagePath,
                link_url: form.link_url.trim() || null,
                is_active: form.is_active,
                sort_order: parseInt(form.sort_order, 10) || 0,
              }
            : r
        )
      );
      resetForm();
    }
    if (isNew) {
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("admin.hero.confirmDelete"))) return;
    setLoading(true);
    const { error } = await adminDeleteHeroAnnouncement(id);
    setLoading(false);
    if (error) {
      toast({ title: t("admin.toast.error"), description: error, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) resetForm();
    toast({ title: t("admin.hero.deleted") });
  };

  const showForm = editingId !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("admin.hero.title")}</h2>
        <Button type="button" variant="outline" size="sm" onClick={startNew} disabled={loading || editingId === "new"}>
          <Plus className="h-4 w-4 mr-1" />
          {t("admin.hero.new")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{t("admin.hero.hint")}</p>

      {showForm && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.hero.titleLabel")}</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("admin.hero.titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.hero.bodyLabel")}</label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder={t("admin.hero.bodyPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.hero.linkLabel")}</label>
            <Input
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              placeholder={t("admin.hero.linkPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("admin.hero.sortLabel")}</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-input"
                />
                {t("admin.hero.activeLabel")}
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.hero.imageLabel")}</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{t("admin.hero.imageHint")}</p>
            {(imageFile || form.image_url) && (
              <div className="relative overflow-hidden rounded-lg border border-border w-full max-w-sm aspect-[16/9] bg-muted">
                <Image
                  src={imageFile ? URL.createObjectURL(imageFile) : form.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={!!imageFile}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.hero.save")}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={loading}>
              {t("admin.hero.cancel")}
            </Button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {rows.length === 0 && !showForm ? (
          <li className="text-sm text-muted-foreground py-6 text-center border rounded-xl">{t("admin.hero.empty")}</li>
        ) : (
          rows.map((a) => (
            <li
              key={a.id}
              className={cn(
                "flex flex-col sm:flex-row gap-3 sm:items-center justify-between rounded-xl border p-3",
                !a.is_active && "opacity-60"
              )}
            >
              <div className="flex gap-3 min-w-0">
                <div className="relative h-16 w-28 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {a.image_url ? (
                    <Image src={a.image_url} alt="" fill className="object-cover" sizes="112px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.hero.sortLabel")}: {a.sort_order} · {a.is_active ? t("admin.hero.activeLabel") : t("admin.hero.inactive")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(a)}
                  disabled={loading || editingId === "new"}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(a.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
