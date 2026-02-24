-- ============================================================
-- DealRadar Full Database Migration (001 + 002 combined)
-- Run this ONCE in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text default 'GLOBAL',
  role text not null default 'user' check (role in ('user', 'admin')),
  trust_score integer not null default 0,
  points integer not null default 0,
  level integer not null default 1,
  badges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
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
  trending_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  primary key (user_id, deal_id)
);

create table if not exists public.deal_comments (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  reminder_settings jsonb not null default '{"3d": true, "1d": true, "6h": true, "1h": true}'::jsonb,
  sent_reminders jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null default '',
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_reports (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_deals_end_at on public.deals(end_at);
create index if not exists idx_deals_heat_score on public.deals(heat_score desc);
create index if not exists idx_deals_country on public.deals(country);
create index if not exists idx_deals_status on public.deals(status);
create index if not exists idx_deals_created_at on public.deals(created_at desc);
create index if not exists idx_deals_provider on public.deals(provider);
create index if not exists idx_deals_created_by on public.deals(created_by);
create index if not exists idx_deal_comments_deal_id on public.deal_comments(deal_id);
create index if not exists idx_deal_saves_deal_id on public.deal_saves(deal_id);
create index if not exists idx_deal_saves_user_id on public.deal_saves(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_deal_reports_deal_id on public.deal_reports(deal_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Compute level from points
create or replace function compute_level(pts integer)
returns integer language plpgsql immutable as $$
begin
  if pts >= 1000 then return 5;
  elsif pts >= 400 then return 4;
  elsif pts >= 150 then return 3;
  elsif pts >= 50 then return 2;
  else return 1;
  end if;
end;
$$;

-- Award points to a user and update level
create or replace function award_points(target_user_id uuid, amount integer)
returns void language plpgsql security definer as $$
declare
  new_points integer;
  new_level integer;
begin
  update public.profiles
    set points = points + amount
    where user_id = target_user_id
    returning points into new_points;

  new_level := compute_level(new_points);

  update public.profiles
    set level = new_level
    where user_id = target_user_id and level != new_level;
end;
$$;

-- Check and award badges
create or replace function check_badges(target_user_id uuid)
returns void language plpgsql security definer as $$
declare
  p_record record;
  approved_count integer;
  trending_count integer;
  current_badges jsonb;
  new_badges jsonb;
begin
  select * into p_record from public.profiles where user_id = target_user_id;
  if not found then return; end if;

  current_badges := p_record.badges;
  new_badges := current_badges;

  select count(*) into approved_count
    from public.deals where created_by = target_user_id and status = 'approved';

  select count(*) into trending_count
    from public.deals where created_by = target_user_id and trending_awarded = true;

  if approved_count >= 1 and not current_badges @> '"early_hunter"'::jsonb then
    new_badges := new_badges || '"early_hunter"'::jsonb;
  end if;

  if trending_count >= 1 and not current_badges @> '"trending_hunter"'::jsonb then
    new_badges := new_badges || '"trending_hunter"'::jsonb;
  end if;

  if approved_count >= 10 and not current_badges @> '"community_builder"'::jsonb then
    new_badges := new_badges || '"community_builder"'::jsonb;
  end if;

  if p_record.level >= 3 and approved_count >= 3 and not current_badges @> '"trusted_submitter"'::jsonb then
    new_badges := new_badges || '"trusted_submitter"'::jsonb;
  end if;

  if new_badges != current_badges then
    update public.profiles set badges = new_badges where user_id = target_user_id;
  end if;
end;
$$;

-- Recalculate heat score with time decay + trending bonus
create or replace function recalculate_heat_score(target_deal_id uuid)
returns void language plpgsql security definer as $$
declare
  saves_count integer;
  net_votes integer;
  new_score numeric;
  deal_record record;
  deal_owner uuid;
begin
  select * into deal_record from public.deals where id = target_deal_id;
  if not found then return; end if;

  select count(*) into saves_count from public.deal_saves where deal_id = target_deal_id;
  select coalesce(sum(vote), 0) into net_votes from public.deal_votes where deal_id = target_deal_id;

  new_score := (saves_count * 3) + (greatest(net_votes, 0) * 2) + (coalesce(deal_record.view_count, 0) * 0.1)
    - extract(epoch from (now() - deal_record.created_at)) / 86400.0;

  update public.deals set heat_score = greatest(new_score, 0) where id = target_deal_id;

  if new_score >= 50 and not deal_record.trending_awarded then
    update public.deals set trending_awarded = true where id = target_deal_id;
    select created_by into deal_owner from public.deals where id = target_deal_id;
    if deal_owner is not null then
      perform award_points(deal_owner, 25);
      perform check_badges(deal_owner);
    end if;
  end if;
end;
$$;

-- Trigger: recalculate heat on save changes + award points
create or replace function on_deal_save_change()
returns trigger language plpgsql security definer as $$
declare
  deal_owner uuid;
begin
  if TG_OP = 'INSERT' then
    select created_by into deal_owner from public.deals where id = NEW.deal_id;
    if deal_owner is not null and deal_owner != NEW.user_id then
      update public.profiles set trust_score = trust_score + 1 where user_id = deal_owner;
      perform award_points(deal_owner, 2);
      perform check_badges(deal_owner);
    end if;
    perform recalculate_heat_score(NEW.deal_id);
  elsif TG_OP = 'DELETE' then
    select created_by into deal_owner from public.deals where id = OLD.deal_id;
    if deal_owner is not null and deal_owner != OLD.user_id then
      update public.profiles set trust_score = greatest(trust_score - 1, 0) where user_id = deal_owner;
    end if;
    perform recalculate_heat_score(OLD.deal_id);
  end if;
  return null;
end;
$$;

-- Trigger: recalculate heat on vote changes + award points
create or replace function on_deal_vote_change()
returns trigger language plpgsql security definer as $$
declare
  deal_owner uuid;
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    select created_by into deal_owner from public.deals where id = NEW.deal_id;
    if TG_OP = 'INSERT' and NEW.vote = 1 and deal_owner is not null and deal_owner != NEW.user_id then
      perform award_points(deal_owner, 1);
    end if;
    perform recalculate_heat_score(NEW.deal_id);
  elsif TG_OP = 'DELETE' then
    perform recalculate_heat_score(OLD.deal_id);
  end if;
  return null;
end;
$$;

-- Auto-create profile on auth signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, display_name)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  return NEW;
end;
$$;

-- Updated_at auto-update
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Increment view count
create or replace function increment_view_count(target_deal_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.deals set view_count = view_count + 1 where id = target_deal_id;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Drop existing triggers first to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_deal_updated on public.deals;
drop trigger if exists on_deal_save_changed on public.deal_saves;
drop trigger if exists on_deal_vote_changed on public.deal_votes;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create trigger on_deal_updated
  before update on public.deals
  for each row execute function handle_updated_at();

create trigger on_deal_save_changed
  after insert or delete on public.deal_saves
  for each row execute function on_deal_save_change();

create trigger on_deal_vote_changed
  after insert or update or delete on public.deal_votes
  for each row execute function on_deal_vote_change();

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
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

-- Deals
drop policy if exists "Approved deals are viewable by everyone" on public.deals;
create policy "Approved deals are viewable by everyone"
  on public.deals for select using (status = 'approved' or created_by = auth.uid());

drop policy if exists "Authenticated users can create deals" on public.deals;
create policy "Authenticated users can create deals"
  on public.deals for insert with check (auth.uid() = created_by);

drop policy if exists "Users can update own deals" on public.deals;
create policy "Users can update own deals"
  on public.deals for update using (auth.uid() = created_by);

drop policy if exists "Admins can do anything with deals" on public.deals;
create policy "Admins can do anything with deals"
  on public.deals for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- Deal Votes
drop policy if exists "Votes are viewable by everyone" on public.deal_votes;
create policy "Votes are viewable by everyone"
  on public.deal_votes for select using (true);

drop policy if exists "Authenticated users can vote" on public.deal_votes;
create policy "Authenticated users can vote"
  on public.deal_votes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own votes" on public.deal_votes;
create policy "Users can update own votes"
  on public.deal_votes for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own votes" on public.deal_votes;
create policy "Users can delete own votes"
  on public.deal_votes for delete using (auth.uid() = user_id);

-- Deal Comments
drop policy if exists "Comments are viewable by everyone" on public.deal_comments;
create policy "Comments are viewable by everyone"
  on public.deal_comments for select using (true);

drop policy if exists "Authenticated users can comment" on public.deal_comments;
create policy "Authenticated users can comment"
  on public.deal_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.deal_comments;
create policy "Users can delete own comments"
  on public.deal_comments for delete using (auth.uid() = user_id);

-- Deal Saves
drop policy if exists "Users can view own saves" on public.deal_saves;
create policy "Users can view own saves"
  on public.deal_saves for select using (auth.uid() = user_id);

drop policy if exists "Users can save deals" on public.deal_saves;
create policy "Users can save deals"
  on public.deal_saves for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own saves" on public.deal_saves;
create policy "Users can update own saves"
  on public.deal_saves for update using (auth.uid() = user_id);

drop policy if exists "Users can unsave deals" on public.deal_saves;
create policy "Users can unsave deals"
  on public.deal_saves for delete using (auth.uid() = user_id);

drop policy if exists "Save counts are viewable" on public.deal_saves;
create policy "Save counts are viewable"
  on public.deal_saves for select using (true);

-- Notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Deal Reports
drop policy if exists "Users can create reports" on public.deal_reports;
create policy "Users can create reports"
  on public.deal_reports for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view reports" on public.deal_reports;
create policy "Admins can view reports"
  on public.deal_reports for select using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public) values ('deal-images', 'deal-images', true)
on conflict do nothing;

drop policy if exists "Anyone can view deal images" on storage.objects;
create policy "Anyone can view deal images"
  on storage.objects for select using (bucket_id = 'deal-images');

drop policy if exists "Authenticated users can upload deal images" on storage.objects;
create policy "Authenticated users can upload deal images"
  on storage.objects for insert with check (bucket_id = 'deal-images' and auth.role() = 'authenticated');

drop policy if exists "Users can delete own deal images" on storage.objects;
create policy "Users can delete own deal images"
  on storage.objects for delete using (bucket_id = 'deal-images' and auth.uid()::text = (storage.foldername(name))[1]);
