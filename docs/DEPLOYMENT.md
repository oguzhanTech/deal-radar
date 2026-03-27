# Domain ve canlıya alma (topla.online)

Bu dokümanda uygulamanın **topla.online** domain’ine alınması ve SEO / Google hazırlıkları özetlenir.

## 1. Ortam değişkenleri (production)

Canlı ortamda aşağıdakileri ayarlayın:

```env
NEXT_PUBLIC_APP_URL=https://www.topla.online
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
CRON_SECRET=...
```

- **NEXT_PUBLIC_APP_URL**: Tüm canonical URL’ler, sitemap, robots.txt ve e-posta/redirect linkleri bu adresi kullanır. Production’da mutlaka `https://www.topla.online` yapın.

### Canonical host ve harici servisler (ör. `topla-deal-ingestion`)

- **Production canonical host:** `https://www.topla.online` (www’li adres; Vercel/DNS’te apex `topla.online` genelde buraya yönlendirilir).
- Harici servislerin **`TOPLA_API_BASE_URL`** değişkeni **sonunda `/` olmadan** bu host olmalıdır, örn. `https://www.topla.online`. İstekler `POST {TOPLA_API_BASE_URL}/internal/deals/import` veya eşdeğer API yoluna gider ([iç import API](INTERNAL_IMPORT.md)).
- **Staging / preview:** Repoda sabit bir staging URL yok; Vercel **Preview** deployment URL’nizi veya ayrı bir staging domain kullanıyorsanız onu `TOPLA_API_BASE_URL` olarak verin (aynı kurallar geçerli).

## 2. Supabase Auth redirect URL’leri

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://www.topla.online`
- **Redirect URLs** listesine ekleyin:
  - `https://www.topla.online`
  - `https://www.topla.online/auth/callback`
  - `https://www.topla.online/login`

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
5. Yeni sitemap ekleyin: `https://www.topla.online/sitemap.xml`

Uygulama zaten şunları üretir:
- **Sitemap**: `/sitemap.xml` — ana sayfa, keşfet, liderlik tablosu, fırsat sayfaları vb.
- **robots.txt**: `/robots.txt` — sitemap referansı ve tarama kuralları (admin/auth/api ve /my disallow).

## 5. SEO özeti (uygulama tarafı)

- **metadataBase**: Root layout’ta `NEXT_PUBLIC_APP_URL` ile ayarlı; tüm Open Graph / Twitter ve canonical URL’ler buna göre üretilir.
- **Sitemap**: Statik sayfalar + onaylı her deal için `/deal/[id]` otomatik eklenir.
- **robots.txt**: Tüm botlar için index/follow açık; admin, auth, api ve /my kapalı.
- **Mobil öncelik**: Viewport, theme-color, manifest ve Apple web app meta’ları mevcut; öncelik mobil, masaüstü de desteklenir.

## 6. Canlıda oturum / Radarım / profil ismi sorunu

Local’de çalışıp canlıda **Radarım açılmıyor**, **profil ismi güncellenmiyor** veya **giriş sonrası session kayboluyor** gibi durumlar neredeyse hep aşağıdaki ayarlardan kaynaklanır.

### Vercel (veya kullandığın host) Environment Variables

Canlı projede mutlaka tanımlı olsun:

| Değişken | Değer (canlı) |
|----------|----------------|
| `NEXT_PUBLIC_APP_URL` | `https://www.topla.online` |
| `NEXT_PUBLIC_SUPABASE_URL` | (local’deki ile aynı) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (local’deki ile aynı) |
| `SUPABASE_SERVICE_ROLE_KEY` | (local’deki ile aynı) |

- **Önemli:** `NEXT_PUBLIC_APP_URL` canlıda **kesinlikle** `https://www.topla.online` olmalı (localhost değil).
- Değişkenleri ekledikten veya değiştirdikten sonra **redeploy** (Production’da yeniden deploy) yap.

### Supabase Dashboard → Authentication → URL Configuration

1. **Site URL** alanı canlı için şu olmalı:  
   `https://www.topla.online`  
   (Sadece localhost bırakılırsa giriş sonrası yönlendirme ve cookie’ler canlıda bozulur.)

2. **Redirect URLs** listesinde **ikisi de** bulunmalı:
   - `https://www.topla.online`
   - `https://www.topla.online/auth/callback`

   İstersen ek olarak şunlar da olabilir:
   - `https://www.topla.online/login`
   - `http://localhost:3000/auth/callback` (local geliştirme için)

Bu iki ayar (Vercel env + Supabase URL/Redirect) doğru değilse canlıda session düşer, Radarım ve profil sayfası “giriş yapmamış” gibi davranır veya profil ismi güncellenmiş gibi görünmez.

### Özet kontrol

- [ ] Vercel’de `NEXT_PUBLIC_APP_URL=https://www.topla.online` (ve redeploy)
- [ ] Supabase **Site URL** = `https://www.topla.online`
- [ ] Supabase **Redirect URLs** içinde `https://www.topla.online/auth/callback` var
- [ ] Tarayıcıda canlı sitede **çıkış yap → tekrar giriş yap** denendi

## 7. Mobil push bildirimleri (ücretsiz Web Push)

Hatırlatmalar e-posta ile değil, sadece **mobil push** (ve tarayıcı bildirimi) ile gönderilir. Web Push API kullanılır; ek ücret yok.

### 7.1 VAPID anahtarları

1. Proje kökünde: `npx web-push generate-vapid-keys`
2. Çıkan **public key** ve **private key**’i Vercel (ve .env.local) ortam değişkenlerine ekleyin:

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Üretilen public key (client + server) |
| `VAPID_PRIVATE_KEY` | Üretilen private key (sadece server; deploy’da gizli tutun) |

### 7.2 Veritabanı

Supabase SQL Editor’da `supabase/migrations/004_push_subscriptions.sql` dosyasını çalıştırın (push abonelikleri tablosu).

### 7.3 Cron (hatırlatma job’ı)

Vercel’de **Cron Jobs** kısmına bir job ekleyin; örneğin günde 2–4 kez veya her saat:

- **Path**: `/api/cron/reminders`
- **Schedule**: Örn. `0 */6 * * *` (her 6 saatte bir)
- **Header**: `Authorization: Bearer <CRON_SECRET>` (CRON_SECRET env’de tanımlı olsun)

Böylece radar’a eklenen fırsatlar bitişe 3 gün / 1 gün / 6 saat / 1 saat kala kullanıcıya hem uygulama içi bildirim hem de mobil push ile iletilecek.

## 8. PWA / APK ve service worker (`public/sw.js`)

- **Navigasyon**: Tam sayfa istekleri ağ-öncelikli; ilk denemede makul bir süre (soğuk WebView açılışı) ve başarısızlıkta daha uzun ikinci bir ağ denemesi kullanılır. Böylece yavaş ama çalışan bağlantıda yanlışlıkla `offline.html` gösterilmesi azaltılır.
- **Doğrulama (manuel)**: Deploy sonrası gerçek cihazda APK/TWA’yı kapatıp soğuk açılış yapın; ilk yüklemede ana sayfanın geldiğini doğrulayın. Sorun devam ederse Chrome uzaktan hata ayıklama ile `Application → Service Workers` üzerinden güncel `sw.js`’in yüklendiğini kontrol edin.

## 9. Genel kontrol listesi

- [ ] Production’da `NEXT_PUBLIC_APP_URL=https://www.topla.online`
- [ ] Push için: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ve `VAPID_PRIVATE_KEY` tanımlı, `004_push_subscriptions.sql` çalıştırıldı, cron job ayarlandı
- [ ] Supabase Site URL ve Redirect URLs güncellendi (yukarıdaki gibi)
- [ ] Domain DNS ve Vercel domain bağlantısı tamamlandı
- [ ] Google Search Console’da alan doğrulandı
- [ ] Sitemap olarak `https://www.topla.online/sitemap.xml` eklendi
- [ ] Gerekirse e-posta (Resend) gönderim domain’i topla.online ile uyumlu hale getirildi
