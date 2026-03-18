"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Loader2, ImagePlus, ZoomIn, ZoomOut, X } from "lucide-react";
import { uploadProfileImage } from "@/app/actions";
import { t } from "@/lib/i18n";

const IMAGE_ZOOM_MIN = 1;
const IMAGE_ZOOM_MAX = 3;
const IMAGE_ZOOM_STEP = 0.25;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 4000; // px
const OUTPUT_SIZE = 512;

function getTouchDistance(e: TouchEvent<HTMLDivElement>) {
  if (e.touches.length < 2) return null;
  const a = e.touches[0];
  const b = e.touches[1];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  const img = new window.Image();
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_load_failed"));
  });
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
}

async function cropImageForProfile(file: File, focusX: number, focusY: number, zoom: number = 1): Promise<File> {
  if (typeof window === "undefined" || typeof window.Image === "undefined") return file;

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

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, offsetX, offsetY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.9);
    });

    return new File([blob], file.name.replace(/\.\w+$/, "") + "-avatar.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ProfileAvatarUploaderProps {
  currentUrl: string | null | undefined;
  fallbackLetter: string;
  onUploaded: (url: string | null, path: string | null) => void;
}

export function ProfileAvatarUploader({ currentUrl, fallbackLetter, onUploaded }: ProfileAvatarUploaderProps) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFocusX, setImageFocusX] = useState(0.5);
  const [imageFocusY, setImageFocusY] = useState(0.5);
  const [imageZoom, setImageZoom] = useState(1);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartFocusX, setDragStartFocusX] = useState(0.5);
  const [dragStartFocusY, setDragStartFocusY] = useState(0.5);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputId = useMemo(() => `avatar_upload_${Math.random().toString(16).slice(2)}`, []);

  const resetFileInput = () => {
    const el = document.getElementById(fileInputId) as HTMLInputElement | null;
    if (el) el.value = "";
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const clearSelection = () => {
    setImageFile(null);
    setImageZoom(1);
    setImageFocusX(0.5);
    setImageFocusY(0.5);
    setDragStartX(null);
    setDragStartY(null);
    pinchStartRef.current = null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    // Aynı dosyayı tekrar seçince onChange'in tetiklenmesi için value'yu temizleyelim.
    resetFileInput();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    if (isGif) {
      toast({ title: t("create.error.failed"), description: "GIF desteklenmiyor.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast({ title: t("create.error.failed"), description: "Dosya çok büyük. Max 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast({ title: t("create.error.failed"), description: "Sadece JPG veya PNG desteklenir.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    try {
      const { width, height } = await getImageDimensions(url);
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        toast({
          title: t("create.error.failed"),
          description: `Görsel çok büyük (maks ${MAX_DIMENSION}px).`,
          variant: "destructive",
        });
        URL.revokeObjectURL(url);
        e.target.value = "";
        return;
      }
    } catch {
      URL.revokeObjectURL(url);
      e.target.value = "";
      toast({ title: t("create.error.failed"), description: "Görsel okunamadı.", variant: "destructive" });
      return;
    }

    clearSelection();
    setImageFile(file);
    setImagePreview(url);
    setImageZoom(1);
    setImageFocusX(0.5);
    setImageFocusY(0.5);
    setOpen(true);
    // Kullanıcı aynı dosyayı tekrar seçerse yine tetiklenmesi için temizle.
    resetFileInput();
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
    const sens = 300;
    const nextX = Math.min(1, Math.max(0, dragStartFocusX - (clientX - dragStartX) / sens));
    const nextY = Math.min(1, Math.max(0, dragStartFocusY - (clientY - dragStartY) / sens));
    setImageFocusX(nextX);
    setImageFocusY(nextY);
  };

  const handleImageDragEnd = () => {
    setDragStartX(null);
    setDragStartY(null);
  };

  const onSave = async () => {
    if (!imageFile || !imagePreview || uploading) return;
    setUploading(true);
    try {
      let fileToUpload: File = imageFile;
      try {
        fileToUpload = await cropImageForProfile(imageFile, imageFocusX, imageFocusY, imageZoom);
      } catch {
        // cropping fails -> upload original
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      const result = await uploadProfileImage(formData);
      if ("error" in result) {
        toast({ title: t("create.error.failed"), description: result.error, variant: "destructive" });
        return;
      }

      onUploaded(result.url, result.path ?? null);
      setOpen(false);
      clearSelection();
      toast({ title: t("profile.updated") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input id={fileInputId} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />

      <div className="relative z-10">
        <button
          type="button"
          onClick={() => document.getElementById(fileInputId)?.click()}
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold shadow-lg cursor-pointer"
          aria-label="Profil resmi değiştir"
          title="Profil resmi değiştir"
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Profil resmi" className="h-full w-full rounded-full object-cover" />
          ) : (
            fallbackLetter
          )}
          <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[10px] text-white">
            <ImagePlus className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <Sheet open={open} onOpenChange={(v) => { if (!v) clearSelection(); setOpen(v); }}>
        <SheetContent side="right" className="p-0">
          <div className="p-5 border-b border-border/60">
            <SheetHeader>
              <SheetTitle className="text-base">Profil resmi</SheetTitle>
            </SheetHeader>
            <p className="text-xs text-muted-foreground mt-8">Sürükleyerek odakla, yakınlaştır/uzaklaştır.</p>
          </div>

          <div className="p-5 space-y-4">
            {imagePreview ? (
              <div className="space-y-3">
                <div className="space-y-3">
                  <div
                    className="relative aspect-square rounded-full overflow-hidden bg-muted select-none cursor-grab active:cursor-grabbing touch-none max-w-[280px] mx-auto"
                    style={{ touchAction: "none" }}
                    onMouseDown={handleImageDragStart}
                    onMouseMove={handleImageDragMove}
                    onMouseUp={handleImageDragEnd}
                    onMouseLeave={handleImageDragEnd}
                    onTouchStart={handleImageTouchStart}
                    onTouchMove={handleImageTouchMove}
                    onTouchEnd={handleImageTouchEnd}
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

                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-xl w-9 h-9 flex items-center justify-center text-xs cursor-pointer pointer-events-auto z-10"
                      onClick={() => { setOpen(false); clearSelection(); }}
                      aria-label="Kapat"
                      title="Kapat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Zoom kontrolleri avatar dışında; mobilde pinch kullanılacak */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl shrink-0 text-foreground"
                      onClick={() => setImageZoom((z) => Math.max(IMAGE_ZOOM_MIN, z - IMAGE_ZOOM_STEP))}
                      disabled={imageZoom <= IMAGE_ZOOM_MIN}
                      aria-label="Uzaklaştır"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground min-w-[3.5rem] text-center tabular-nums">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl shrink-0 text-foreground"
                      onClick={() => setImageZoom((z) => Math.min(IMAGE_ZOOM_MAX, z + IMAGE_ZOOM_STEP))}
                      disabled={imageZoom >= IMAGE_ZOOM_MAX}
                      aria-label="Yakınlaştır"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Masaüstü: sürükle + zoom butonları. Mobil: iki parmakla pinch.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Resim seç.</div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-12 flex-1 text-foreground"
                onClick={() => {
                  setOpen(false);
                  clearSelection();
                }}
                disabled={uploading}
              >
                İptal
              </Button>
              <Button
                type="button"
                className="rounded-xl h-12 flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold"
                onClick={onSave}
                disabled={!imagePreview || uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

