# DealRadar

Community-driven deals and discount reminder PWA for digital products and subscriptions.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime)
- **Email**: Resend
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Resend account

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxx
CRON_SECRET=a-random-secret-string
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Harici deal import (topla-deal-ingestion) — repoya asla commit etmeyin
# TOPLA_IMPORT_API_KEY=...
# TOPLA_IMPORT_ACTOR_MAP={"topla_trendyol_bot":"<auth.users-uuid>"}
# veya TOPLA_IMPORT_DEFAULT_BOT_USER_ID + TOPLA_IMPORT_ALLOWED_ACTORS
```

Production’da `NEXT_PUBLIC_APP_URL=https://www.topla.online` kullanın. Domain, sitemap, Google Search Console ve Supabase ayarları için [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) dosyasına bakın. Yüklü PWA’da masaüstü kabuğu ve pencere genişliği için aynı dokümanda **PWA ve masaüstü görünümü** bölümüne bakın.

Harici servislerin `POST /internal/deals/import` ile deal aktarması için [docs/INTERNAL_IMPORT.md](docs/INTERNAL_IMPORT.md) dosyasına bakın (`TOPLA_IMPORT_API_KEY` ve bot `actorKey` eşlemesi).

### 3. Set up the database

Run the migration SQL in your Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
```

Then optionally run the seed data:

```
supabase/seed.sql
```

> **Note**: Seed data uses a placeholder `created_by` UUID. After your first signup, update the seed deals:
> ```sql
> UPDATE deals SET created_by = 'your-user-id' WHERE created_by = '00000000-0000-0000-0000-000000000000';
> ```

### 4. Configure Supabase Auth

In your Supabase dashboard:
- **Authentication → Providers → Email**: **Email + password** açık olsun. Uygulama magic link kullanmaz; isterseniz aynı ekranda magic link / OTP’yi kapatabilirsiniz.
- **Email confirmation**: Geliştirmede tek adımda giriş için genelde kapalı tutulur. Üretimde açıksa kullanıcı kayıt sonrası e-postadaki bağlantıya tıklayınca `…/auth/callback` ile oturum açılır.
- **Redirect URL’ler (doğrulama maili için kritik):** `Authentication → URL Configuration` altında **Redirect URLs** listesinde, kodun gönderdiği adresin **aynen** bulunması gerekir. Kayıtta `emailRedirectTo` şu adresten üretilir: önce `NEXT_PUBLIC_APP_URL` (önerilir, bkz. docs/DEPLOYMENT.md), yoksa tarayıcı `origin`. Örnek: `https://www.topla.online/auth/callback` ve gerekirse `https://topla.online/auth/callback` (www / apex ikisini de ekleyin).
- Doğrulama e-postaları gelmiyorsa önce **Authentication → Logs**, e-posta şablonları ve gerekirse **Custom SMTP** ayarlarını kontrol edin. Varsayılan gönderici özellikle prod'da sınırlı olabilir. Log’da `user_repeated_signup` görüyorsanız aynı e-posta ile tekrar kayıt denenmiştir; yeni doğrulama postası her zaman gitmeyebilir.
- Enable **Google** provider (add OAuth credentials)
- Set redirect URL to `http://localhost:3000/auth/callback` (development). Production için yukarıdaki tam `…/auth/callback` URL’lerini ekleyin (bkz. docs/DEPLOYMENT.md).

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Make yourself an admin

After signing up, run in Supabase SQL editor:

```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'your-user-id';
```

## Project Structure

```
src/
├── app/
│   ├── (main)/         # Pages with bottom nav (Home, Search, Deal, My Radar, Create, Profile)
│   ├── (auth)/         # Login page
│   ├── admin/          # Admin panel (Deals, Users, Reports)
│   ├── auth/callback/  # Supabase auth callback
│   └── api/            # API routes (cron, share-card, view count)
├── components/
│   ├── ui/             # shadcn/ui primitives
│   ├── layout/         # TopHeader, BottomNav
│   ├── deals/          # DealCard, DealCountdown, HeatBadge, SaveRemindButton
│   ├── auth/           # AuthProvider, LoginModal, AuthGuard
│   └── notifications/  # NotificationBell
├── lib/
│   ├── supabase/       # Client, Server, Admin, Middleware
│   ├── types/          # TypeScript types
│   ├── constants.ts    # Providers, categories, countries
│   ├── email.ts        # Resend integration
│   └── utils.ts        # Helpers
└── hooks/              # useCountdown
```

## Features

- **Anonymous browsing** with auth-gated actions
- **One-tap Save & Remind** with automatic reminder scheduling
- **Live countdowns** on all deal cards
- **Heat Score** trending system (saves × 3 + votes × 2 + views × 0.1)
- **Trusted Submitter** auto-approval system
- **Admin panel** for deal/user/report management
- **Email + in-app reminders** via Vercel Cron + Resend
- **Shareable OG image cards** via @vercel/og
- **PWA** installable with offline fallback
- **Country-specific deals** with Global + per-country filtering

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set the same environment variables in Vercel dashboard. The cron job for reminders is configured in `vercel.json`.
