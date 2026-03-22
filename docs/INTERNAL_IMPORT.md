# İç API: deal import (`topla-deal-ingestion`)

Harici servisler (ör. `topla-deal-ingestion`) deal verisini **yalnızca** bu endpoint üzerinden sisteme aktarır. UI veya doğrudan veritabanı erişimi kullanılmaz.

## URL ve yöntem

- **Production `TOPLA_API_BASE_URL` (sonunda `/` yok):** `https://www.topla.online`
- **Endpoint:** `POST {TOPLA_API_BASE_URL}/internal/deals/import`  
  Next.js uygulamasında bu yol [`/api/internal/deals/import`](../src/app/api/internal/deals/import/route.ts) adresine yönlendirilir (`next.config.ts` `rewrites`).

Staging veya Vercel Preview için aynı yolu kullanın; base URL olarak ilgili deployment kök adresini verin.

## Kimlik doğrulama

İstek başlığı:

```http
Authorization: Bearer <TOPLA_IMPORT_API_KEY>
```

- `TOPLA_IMPORT_API_KEY` **asla** repoya veya public kanallara konmamalıdır.
- Vercel **Environment Variables** (veya kullandığınız secret store) içinde tanımlayın.
- Ingestion ekibine yalnızca güvenli kanal üzerinden iletin.

### Anahtar üretimi ve rotasyon

Yerelde güçlü bir secret üretmek için (örnek):

```bash
openssl rand -hex 32
```

Rotasyon:

1. Yeni anahtarı Vercel’de `TOPLA_IMPORT_API_KEY` olarak ekleyin (veya değiştirin).
2. Deploy alın.
3. Ingestion servisinin env’ini güncelleyin.
4. Eski anahtarı kaldırın (tek anahtar kullanıyorsanız).

## Bot / `actorKey` eşlemesi

Deal kaydı `created_by` alanında **gerçek bir `auth.users` kullanıcı UUID**’sine ihtiyaç duyar. Import isteği **`actorKey`** ile hangi bot/kaynağın paylaştığını belirtir; sunucu bunu **yalnızca yapılandırılmış eşlemelerle** bir kullanıcıya çözer.

### Seçenek A — Çoklu bot: JSON harita (önerilen)

`TOPLA_IMPORT_ACTOR_MAP` ortam değişkeninde JSON nesnesi:

```env
TOPLA_IMPORT_ACTOR_MAP={"topla_trendyol_bot":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
```

- Anahtar: `actorKey` (örn. `topla_trendyol_bot`)
- Değer: Supabase `auth.users.id` (UUID)

İstek gövdesindeki `actorKey` bu haritada yoksa **403** döner.

### Seçenek B — Tek bot kullanıcısı + allowlist

```env
TOPLA_IMPORT_DEFAULT_BOT_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TOPLA_IMPORT_ALLOWED_ACTORS=topla_trendyol_bot
```

`TOPLA_IMPORT_ACTOR_MAP` tanımlı değilse bu mod kullanılır. `actorKey` allowlist’te olmalıdır; tüm eşleşen istekler aynı `TOPLA_IMPORT_DEFAULT_BOT_USER_ID` ile oluşturulur.

### Bot kullanıcısını oluşturma

1. Supabase Dashboard → **Authentication** → kullanıcı oluşturun (e-posta + şifre veya yalnızca servis hesabı için uygun yöntem).
2. Kullanıcının **UUID**’sini kopyalayın.
3. İsteğe bağlı: `profiles` tablosunda `display_name` (örn. `Trendyol Bot`) ayarlayın.
4. Bu UUID’yi `TOPLA_IMPORT_ACTOR_MAP` veya `TOPLA_IMPORT_DEFAULT_BOT_USER_ID` içine yazın.

> Not: RLS normal kullanıcılar için `created_by = auth.uid()` ister; import **service role** ile yapıldığı için bu kısıt bypass edilir. Bot hesabının gerçek bir `auth.users` satırına referans vermesi yeterlidir.

## İstek gövdesi (JSON)

Zorunlu:

- `actorKey` (veya `actor_key`): string
- `deal.title`: string
- `deal.end_at` veya kök seviyede `end_at`: ISO 8601 tarih

İsteğe bağlı:

- `metadata`: herhangi bir JSON değer; varsa açıklama metnine `[import]\n...` ile eklenir (kaynak izi için).
- `deal`: nesne; yoksa kök seviyedeki diğer alanlar deal alanı olarak kabul edilir (`actorKey`, `metadata` hariç).

Örnek:

```json
{
  "actorKey": "topla_trendyol_bot",
  "metadata": { "source": "trendyol", "scrapedAt": "2025-03-19T12:00:00Z" },
  "deal": {
    "title": "Örnek ürün",
    "description": "Kısa açıklama",
    "provider": "Trendyol",
    "category": "Teknoloji",
    "start_at": "2025-03-19T00:00:00.000Z",
    "end_at": "2025-03-26T23:59:59.000Z",
    "original_price": 999,
    "deal_price": 799,
    "currency": "TL",
    "discount_percent": 20,
    "image_url": "https://...",
    "external_url": "https://...",
    "status": "approved"
  }
}
```

Varsayılan `status` (gövdede yoksa): `TOPLA_IMPORT_DEFAULT_STATUS` veya `approved`.

## Yerel geliştirme

`.env.local` örneği (değerleri kendi projenize göre doldurun):

```env
TOPLA_IMPORT_API_KEY=dev-only-secret
TOPLA_IMPORT_ACTOR_MAP={"topla_trendyol_bot":"<bot-user-uuid>"}
# veya Seçenek B:
# TOPLA_IMPORT_DEFAULT_BOT_USER_ID=<uuid>
# TOPLA_IMPORT_ALLOWED_ACTORS=topla_trendyol_bot
```

Test:

```bash
curl -sS -X POST "http://localhost:3000/internal/deals/import" \
  -H "Authorization: Bearer dev-only-secret" \
  -H "Content-Type: application/json" \
  -d "{\"actorKey\":\"topla_trendyol_bot\",\"deal\":{\"title\":\"Test\",\"end_at\":\"2099-01-01T00:00:00.000Z\"}}"
```

## Özet kontrol listesi (Topla ekibi)

| Madde | Açıklama |
|--------|-----------|
| `TOPLA_API_BASE_URL` | Production: `https://www.topla.online` (staging için deploy URL’si) |
| `TOPLA_IMPORT_API_KEY` | Vercel secret; repoda yok |
| Actor eşlemesi | `TOPLA_IMPORT_ACTOR_MAP` veya B seçeneği + bot UUID |
| Endpoint | `POST /internal/deals/import` (rewrite ile API route’a gider) |

Bu üç yapılandırma olmadan import **güvenli ve tutarlı** şekilde çalışmaz.
