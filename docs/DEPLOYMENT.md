# Domain ve canlıya alma (topla.online)

Bu dokümanda uygulamanın **topla.online** domain’ine alınması ve SEO / Google hazırlıkları özetlenir.

## 1. Ortam değişkenleri (production)

Canlı ortamda aşağıdakileri ayarlayın:

```env
NEXT_PUBLIC_APP_URL=https://topla.online
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
CRON_SECRET=...
```

- **NEXT_PUBLIC_APP_URL**: Tüm canonical URL’ler, sitemap, robots.txt ve e-posta/redirect linkleri bu adresi kullanır. Production’da mutlaka `https://topla.online` yapın.

## 2. Supabase Auth redirect URL’leri

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://topla.online`
- **Redirect URLs** listesine ekleyin:
  - `https://topla.online`
  - `https://topla.online/auth/callback`
  - `https://topla.online/login`

Google OAuth kullanıyorsanız, Google Cloud Console’da **Authorized redirect URIs** içinde şu olmalı:
- `https://xxx.supabase.co/auth/v1/callback`  
(Supabase’in kendi callback’i; uygulama callback’i `/auth/callback`)

## 3. Hosting ve domain (Vercel örnek)

- Vercel’de projeyi bağlayıp production deploy alın.
- **Settings → Domains** → `topla.online` ekleyin.
- Domain sağlayıcınızda:
  - **A** kaydı: Vercel’in verdiği IP veya
  - **CNAME**: `cname.vercel-dns.com` (Vercel’in talimatına göre)

SSL Vercel tarafından otomatik verilir.

## 4. Google Search Console

1. [Google Search Console](https://search.google.com/search-console) → **Özellik ekle**.
2. **Alan adı** seçin: `topla.online` (önerilir; hem http hem https’i kapsar).
3. **Doğrulama**:
   - **DNS kaydı**: Sağlanan TXT kaydını domain DNS’e ekleyin, birkaç dakika sonra “Doğrula” deyin.
   - veya **HTML dosyası**: Verilen dosyayı `public/` içine koyup deploy edin, sonra doğrulayın.
4. Doğrulama sonrası **Sitemap’ler** bölümüne gidin.
5. Yeni sitemap ekleyin: `https://topla.online/sitemap.xml`

Uygulama zaten şunları üretir:
- **Sitemap**: `/sitemap.xml` — ana sayfa, keşfet, liderlik tablosu, fırsat sayfaları vb.
- **robots.txt**: `/robots.txt` — sitemap referansı ve tarama kuralları (admin/auth/api ve /my disallow).

## 5. SEO özeti (uygulama tarafı)

- **metadataBase**: Root layout’ta `NEXT_PUBLIC_APP_URL` ile ayarlı; tüm Open Graph / Twitter ve canonical URL’ler buna göre üretilir.
- **Sitemap**: Statik sayfalar + onaylı her deal için `/deal/[id]` otomatik eklenir.
- **robots.txt**: Tüm botlar için index/follow açık; admin, auth, api ve /my kapalı.
- **Mobil öncelik**: Viewport, theme-color, manifest ve Apple web app meta’ları mevcut; öncelik mobil, masaüstü de desteklenir.

## 6. Kontrol listesi

- [ ] Production’da `NEXT_PUBLIC_APP_URL=https://topla.online`
- [ ] Supabase Site URL ve Redirect URLs güncellendi
- [ ] Domain DNS ve Vercel domain bağlantısı tamamlandı
- [ ] Google Search Console’da alan doğrulandı
- [ ] Sitemap olarak `https://topla.online/sitemap.xml` eklendi
- [ ] Gerekirse e-posta (Resend) gönderim domain’i topla.online ile uyumlu hale getirildi
