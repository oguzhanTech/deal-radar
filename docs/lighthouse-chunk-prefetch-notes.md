# Lighthouse “kullanılmayan JS” ve chunk eşlemesi (iç doğrulama)

Üretim derlemesinde (`npm run analyze` / `.next/static/chunks`) hash’ler sürüme göre değişir; Lighthouse ekranındaki `9247`, `96` vb. bu dosyalarla eşleşir.

## Chunk içerik özeti (mevcut build)

| Dosya örneği | Yaklaşık içerik |
|--------------|------------------|
| `9247-*.js` | **@supabase** (realtime, auth-js, cookie/ssr yardımcıları) — bildirimler, oturum, istemci Supabase kullanan sayfalar bu paketi paylaşır. |
| `96-*.js` | **framer-motion** (motion, layout animasyonları) — shell ve birçok bileşen doğrudan veya dolaylı import eder. |
| `1255-*.js` | Paylaşılan uygulama parçası (build çıktısında “First Load JS” ile listelenir). |
| `4bd1b696-*.js` | React / framework ile ilişkili paylaşılan çekirdek parça. |

Lighthouse “unused” uyarısı, bu dosyaların **indirilip ilk boyamada tüm fonksiyonların çalıştırılmaması** ile uyumludur; özellikle Supabase ve Motion geniş API yüzeyi taşır.

## Prefetch davranışı

Aşağıdakiler, route JS’inin **erken indirilmesine** katkıda bulunur; bu da aynı oturumda “kullanılmayan” bayt olarak görünebilir:

1. **[`src/hooks/use-route-preloader.ts`](../src/hooks/use-route-preloader.ts)** — `requestIdleCallback` (veya fallback) ile `/`, `/profile`, `/create`, `/search`, `/my` ve gecikmeyle `/leaderboard`, `/login` için `prefetchOnce`.
2. **[`src/components/layout/top-header.tsx`](../src/components/layout/top-header.tsx)** / **[`bottom-nav.tsx`](../src/components/layout/bottom-nav.tsx)** — `Link` + `prefetch` + hover/touch ile `prefetchOnce`.
3. **[`src/components/deals/deal-card.tsx`](../src/components/deals/deal-card.tsx)** ve **[`editor-pick-widget.tsx`](../src/components/home/editor-pick-widget.tsx)** — fırsat detayına `router.prefetch` (hover/touch) ve `Link prefetch`.

**Not:** `prefetchOnce` 45 sn TTL ile tekrarı sınırlar ([`src/lib/prefetch-once.ts`](../src/lib/prefetch-once.ts)). Agresif “unused JS” azaltımı için yalnızca ölçüm sonrası `prefetch={false}` veya preloader kapsamını daraltmak düşünülmeli (UX takası).

## Ne zaman koda dokunulur?

- Bundle küçültme: `npm run analyze` → `.next/analyze/client.html` ile modül ağacı.
- Lighthouse ile tekrar: aynı URL, mobil, soğuk önbellek.
