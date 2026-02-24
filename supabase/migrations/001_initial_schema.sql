-- ============================================================
-- DealRadar Database Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (auto-created on auth signup)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text default 'GLOBAL',
  role text not null default 'user' check (role in ('user', 'admin')),
  trust_score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Deals
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  provider text not null,
  category text,
  country text not null default 'GLOBAL',
  start_at timestamptz,
  end_at timestamptz not null,
  original_price numeric(10,2),
  deal_price numeric(10,2),
  currency text not null default 'USD',
  discount_percent integer,
  image_url text,
  storage_path text,
  external_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  heat_score numeric(10,1) not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deal votes
create table public.deal_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  primary key (user_id, deal_id)
);

-- Deal comments
create table public.deal_comments (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Deal saves (with reminder settings)
create table public.deal_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  reminder_settings jsonb not null default '{"3d": true, "1d": true, "6h": true, "1h": true}'::jsonb,
  sent_reminders jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

-- Notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null default '',
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Deal reports
create table public.deal_reports (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_deals_end_at on public.deals(end_at);
create index idx_deals_heat_score on public.deals(heat_score desc);
create index idx_deals_country on public.deals(country);
create index idx_deals_status on public.deals(status);
create index idx_deals_created_at on public.deals(created_at desc);
create index idx_deals_provider on public.deals(provider);
create index idx_deals_created_by on public.deals(created_by);
create index idx_deal_comments_deal_id on public.deal_comments(deal_id);
create index idx_deal_saves_deal_id on public.deal_saves(deal_id);
create index idx_deal_saves_user_id on public.deal_saves(user_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(user_id, read);
create index idx_deal_reports_deal_id on public.deal_reports(deal_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Recalculate heat score for a deal
create or replace function public.recalculate_heat_score(target_deal_id uuid)
returns void as $$
declare
  saves_count integer;
  net_votes integer;
  views integer;
  new_score numeric;
begin
  select count(*) into saves_count from public.deal_saves where deal_id = target_deal_id;
  select coalesce(sum(vote), 0) into net_votes from public.deal_votes where deal_id = target_deal_id;
  select view_count into views from public.deals where id = target_deal_id;

  new_score := (saves_count * 3) + (greatest(net_votes, 0) * 2) + (coalesce(views, 0) * 0.1);

  update public.deals set heat_score = new_score, updated_at = now() where id = target_deal_id;
end;
$$ language plpgsql security definer;

-- Trigger function: recalculate heat on save changes
create or replace function public.on_deal_save_change()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recalculate_heat_score(OLD.deal_id);
    -- Decrement trust score of deal creator
    update public.profiles set trust_score = greatest(trust_score - 1, 0)
      where user_id = (select created_by from public.deals where id = OLD.deal_id);
    return OLD;
  else
    perform public.recalculate_heat_score(NEW.deal_id);
    -- Increment trust score of deal creator
    update public.profiles set trust_score = trust_score + 1
      where user_id = (select created_by from public.deals where id = NEW.deal_id);
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger function: recalculate heat on vote changes
create or replace function public.on_deal_vote_change()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recalculate_heat_score(OLD.deal_id);
    update public.profiles set trust_score = greatest(trust_score - 1, 0)
      where user_id = (select created_by from public.deals where id = OLD.deal_id);
    return OLD;
  else
    perform public.recalculate_heat_score(NEW.deal_id);
    if TG_OP = 'INSERT' then
      update public.profiles set trust_score = trust_score + 1
        where user_id = (select created_by from public.deals where id = NEW.deal_id);
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  return NEW;
end;
$$ language plpgsql security definer;

-- Updated_at auto-update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Increment view count (called from API)
create or replace function public.increment_view_count(target_deal_id uuid)
returns void as $$
begin
  update public.deals set view_count = view_count + 1 where id = target_deal_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_deal_updated
  before update on public.deals
  for each row execute function public.handle_updated_at();

create trigger on_deal_save_changed
  after insert or delete on public.deal_saves
  for each row execute function public.on_deal_save_change();

create trigger on_deal_vote_changed
  after insert or update or delete on public.deal_votes
  for each row execute function public.on_deal_vote_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.deal_votes enable row level security;
alter table public.deal_comments enable row level security;
alter table public.deal_saves enable row level security;
alter table public.notifications enable row level security;
alter table public.deal_reports enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- Deals: anyone can read approved deals
create policy "Approved deals are viewable by everyone"
  on public.deals for select using (status = 'approved' or created_by = auth.uid());

create policy "Authenticated users can create deals"
  on public.deals for insert with check (auth.uid() = created_by);

create policy "Users can update own deals"
  on public.deals for update using (auth.uid() = created_by);

create policy "Admins can do anything with deals"
  on public.deals for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- Deal Votes
create policy "Votes are viewable by everyone"
  on public.deal_votes for select using (true);

create policy "Authenticated users can vote"
  on public.deal_votes for insert with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on public.deal_votes for update using (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.deal_votes for delete using (auth.uid() = user_id);

-- Deal Comments
create policy "Comments are viewable by everyone"
  on public.deal_comments for select using (true);

create policy "Authenticated users can comment"
  on public.deal_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.deal_comments for delete using (auth.uid() = user_id);

-- Deal Saves
create policy "Users can view own saves"
  on public.deal_saves for select using (auth.uid() = user_id);

create policy "Users can save deals"
  on public.deal_saves for insert with check (auth.uid() = user_id);

create policy "Users can update own saves"
  on public.deal_saves for update using (auth.uid() = user_id);

create policy "Users can unsave deals"
  on public.deal_saves for delete using (auth.uid() = user_id);

-- Allow count queries on saves for heat score display
create policy "Save counts are viewable"
  on public.deal_saves for select using (true);

-- Notifications
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Deal Reports
create policy "Users can create reports"
  on public.deal_reports for insert with check (auth.uid() = user_id);

create policy "Admins can view reports"
  on public.deal_reports for select using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public) values ('deal-images', 'deal-images', true)
on conflict do nothing;

create policy "Anyone can view deal images"
  on storage.objects for select using (bucket_id = 'deal-images');

create policy "Authenticated users can upload deal images"
  on storage.objects for insert with check (bucket_id = 'deal-images' and auth.role() = 'authenticated');

create policy "Users can delete own deal images"
  on storage.objects for delete using (bucket_id = 'deal-images' and auth.uid()::text = (storage.foldername(name))[1]);
