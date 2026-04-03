import type { MetadataRoute } from "next";
import { createAnonClient } from "@/lib/supabase/server";
import { dealPath } from "@/lib/deal-url";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.topla.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/profile`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = await createAnonClient();
    const { data: deals } = await supabase
      .from("deals")
      .select("slug, updated_at")
      .eq("status", "approved")
      .gt("end_at", new Date().toISOString());

    const dealUrls: MetadataRoute.Sitemap = (deals ?? []).map((d) => ({
      url: `${baseUrl}${dealPath({ slug: d.slug })}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...dealUrls];
  } catch {
    return staticRoutes;
  }
}
