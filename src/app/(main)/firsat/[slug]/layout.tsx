import { cache } from "react";
import { getImageProps } from "next/image";
import { createClient } from "@/lib/supabase/server";

/** Deal sayfası LCP görseli — sayfa ile aynı sizes/priority ile erken preload */
const getDealImageUrl = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deals")
    .select("image_url")
    .eq("slug", slug)
    .maybeSingle();
  return data?.image_url ?? null;
});

export default async function FirsatSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const imageUrl = await getDealImageUrl(slug);

  if (!imageUrl) {
    return <>{children}</>;
  }

  const { props } = getImageProps({
    src: imageUrl,
    alt: "",
    fill: true,
    sizes: "(max-width: 1024px) 100vw, min(42rem, 50vw)",
    priority: true,
    fetchPriority: "high",
  });

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={props.src}
        imageSrcSet={props.srcSet}
        imageSizes={props.sizes}
        fetchPriority="high"
      />
      {children}
    </>
  );
}
