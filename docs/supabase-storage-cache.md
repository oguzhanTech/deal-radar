# Supabase Storage: uzun önbellek (Lighthouse)

Lighthouse, `*.supabase.co/storage/v1/object/public/...` yanıtlarında kısa `Cache-Control` (ör. 1 saat) gördüğünde tekrar ziyaretlerde verimsiz önbellek uyarısı verebilir.

## Ne yapmalı?

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz → **Storage**.
2. İlgili bucket’ı seçin (ör. profil görselleri: `profile-images` veya kullandığınız isim).
3. Bucket **Configuration** / **Settings** bölümünde **Cache-Control** veya **Public** erişimle ilişkili süre ayarlarını kontrol edin.
4. **Sabit dosya adı + güncellemede yeni dosya** stratejisi kullanıyorsanız, uzun süreli önbellek güvenlidir; örnek: `max-age=31536000, public` (1 yıl).

## Kod tarafı

Profil avatarları artık `next/image` ile `/_next/image` üzerinden optimize edildiği için, tarayıcı çoğu zaman ilk parti URL’sini önbelleğe alır; doğrudan Supabase URL’sine giden istekler azalır.

Yine de Storage kökünden doğrudan yüklenen varlıklar için bucket başlıklarını uzatmak tekrar ziyaretleri hızlandırır.

## Referans

- [Supabase Storage: serving assets](https://supabase.com/docs/guides/storage/serving/downloads)
