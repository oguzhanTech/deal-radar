/**
 * Deal fiyat gösterimi — utils.ts (cn/formatPrice) ile aynı modülde olunca
 * bazı client bundle'larda named export çözümlemesi sorun çıkarabiliyor; bu dosya yalnızca saf fonksiyonlar içerir.
 */

export function dealPricesAreEqual(
  original: number | null | undefined,
  deal: number | null | undefined
): boolean {
  if (original == null || deal == null) return false;
  return Math.round(Number(original) * 100) === Math.round(Number(deal) * 100);
}

export function hasStrikethroughOriginal(
  original: number | null | undefined,
  deal: number | null | undefined
): boolean {
  return original != null && deal != null && !dealPricesAreEqual(original, deal);
}
