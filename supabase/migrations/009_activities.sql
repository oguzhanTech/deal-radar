-- ============================================================
-- Activities feed (Topla'da Neler Oluyor?)
-- ============================================================

-- Table to store recent activity events for homepage widget
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('deal_created', 'vote', 'comment', 'save')),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  comment_id uuid references public.deal_comments(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_created_at on public.activities(created_at desc);
create index if not exists idx_activities_deal_id on public.activities(deal_id);
create index if not exists idx_activities_user_id on public.activities(user_id);

alter table public.activities enable row level security;

-- Everyone can read the feed
drop policy if exists "Activities are viewable by everyone" on public.activities;
create policy "Activities are viewable by everyone"
  on public.activities
  for select
  using (true);

-- ============================================================
-- Trigger helpers (SECURITY DEFINER to bypass RLS on activities)
-- ============================================================

create or replace function public._activity_display_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select display_name from public.profiles where user_id = p_user_id), 'İsimsiz');
$$;

create or replace function public._activity_deal_payload(p_deal_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'deal_title', d.title,
    'deal_price', d.deal_price,
    'original_price', d.original_price,
    'currency', d.currency
  )
  from public.deals d
  where d.id = p_deal_id;
$$;

create or replace function public._activity_insert(
  p_type text,
  p_user_id uuid,
  p_deal_id uuid,
  p_comment_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activities(type, user_id, deal_id, comment_id, payload)
  values (
    p_type,
    p_user_id,
    p_deal_id,
    p_comment_id,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('display_name', public._activity_display_name(p_user_id))
  );
end;
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- Deal approved -> activity (insert OR status transition to approved)
create or replace function public.trg_activity_deal_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if (tg_op = 'INSERT' and new.status = 'approved') then
    payload := public._activity_deal_payload(new.id);
    perform public._activity_insert('deal_created', new.created_by, new.id, null, payload);
  elsif (tg_op = 'UPDATE' and new.status = 'approved' and old.status is distinct from 'approved') then
    payload := public._activity_deal_payload(new.id);
    perform public._activity_insert('deal_created', new.created_by, new.id, null, payload);
  end if;
  return new;
end;
$$;

drop trigger if exists activity_deal_approved on public.deals;
create trigger activity_deal_approved
after insert or update of status
on public.deals
for each row
execute function public.trg_activity_deal_approved();

-- Vote -> activity (on insert; upsert still fires insert)
create or replace function public.trg_activity_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  payload := public._activity_deal_payload(new.deal_id) || jsonb_build_object('vote', new.vote);
  perform public._activity_insert('vote', new.user_id, new.deal_id, null, payload);
  return new;
end;
$$;

drop trigger if exists activity_vote on public.deal_votes;
create trigger activity_vote
after insert
on public.deal_votes
for each row
execute function public.trg_activity_vote();

-- Comment -> activity
create or replace function public.trg_activity_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  snippet text;
begin
  snippet := left(new.content, 120);
  payload := public._activity_deal_payload(new.deal_id) || jsonb_build_object('comment_snippet', snippet);
  perform public._activity_insert('comment', new.user_id, new.deal_id, new.id, payload);
  return new;
end;
$$;

drop trigger if exists activity_comment on public.deal_comments;
create trigger activity_comment
after insert
on public.deal_comments
for each row
execute function public.trg_activity_comment();

-- Save -> activity
create or replace function public.trg_activity_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  payload := public._activity_deal_payload(new.deal_id);
  perform public._activity_insert('save', new.user_id, new.deal_id, null, payload);
  return new;
end;
$$;

drop trigger if exists activity_save on public.deal_saves;
create trigger activity_save
after insert
on public.deal_saves
for each row
execute function public.trg_activity_save();

