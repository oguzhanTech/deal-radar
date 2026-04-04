import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

export type AvatarImageProps = Omit<ImageProps, "src" | "alt" | "fill"> & {
  src?: string | null;
  alt?: string;
  /**
   * Görünen avatar genişliği (Tailwind h-* ile uyumlu); Next görsel genişliği seçer.
   * @default "40px" (h-10 w-10)
   */
  sizes?: string;
};

function AvatarImage({ className, src, alt, sizes = "40px", ...props }: AvatarImageProps) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
