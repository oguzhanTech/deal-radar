import type { Deal } from "@/lib/types/database";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.topla.online";

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out;
}

/** schema.org Offer — fırsat detay sayfası için yapılandırılmış veri */
export function DealJsonLd({ deal }: { deal: Deal }) {
  const now = new Date();
  const end = new Date(deal.end_at);
  const expired = end < now;
  const pageUrl = `${baseUrl}/deal/${deal.id}`;

  const jsonLd = omitUndefined({
    "@context": "https://schema.org",
    "@type": "Offer",
    name: deal.title,
    description: deal.description || undefined,
    url: pageUrl,
    image: deal.image_url || undefined,
    priceValidUntil: deal.end_at,
    availability: expired
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",
    price: deal.deal_price != null ? String(deal.deal_price) : undefined,
    priceCurrency: deal.currency || "TRY",
    seller: {
      "@type": "Organization",
      name: "Topla",
      url: baseUrl,
    },
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
