/** Kanonik fırsat detay yolu (SEO): /firsat/{slug} */
export function dealPath(deal: { slug: string }): string {
  return `/firsat/${encodeURIComponent(deal.slug)}`;
}
