import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.topla.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/auth/", "/api/", "/my"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/auth/", "/api/", "/my"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
