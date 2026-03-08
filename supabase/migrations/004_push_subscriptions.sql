-- Push subscriptions for Web Push (mobile/desktop notifications)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(endpoint)
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

create policy "Users can select own push subscriptions"
  on public.push_subscriptions for select using (auth.uid() = user_id);

-- Service role needs to read all (for cron sending)
create policy "Service role can read push_subscriptions"
  on public.push_subscriptions for select using (auth.role() = 'service_role');
