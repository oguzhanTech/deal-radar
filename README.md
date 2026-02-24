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
```

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
- Enable **Email** provider (magic link)
- Enable **Google** provider (add OAuth credentials)
- Set redirect URL to `http://localhost:3000/auth/callback`

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
