-- Hero carousel announcements (admin-managed)

create table public.hero_announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text,
  image_url text not null,
  image_storage_path text,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_hero_announcements_active_sort on public.hero_announcements(is_active, sort_order);
create index idx_hero_announcements_created_at on public.hero_announcements(created_at desc);

drop trigger if exists on_hero_announcement_updated on public.hero_announcements;
create trigger on_hero_announcement_updated
  before update on public.hero_announcements
  for each row execute function public.handle_updated_at();

alter table public.hero_announcements enable row level security;

drop policy if exists "Active hero announcements are viewable by everyone" on public.hero_announcements;
create policy "Active hero announcements are viewable by everyone"
  on public.hero_announcements for select
  using (is_active = true);

drop policy if exists "Admins can view all hero announcements" on public.hero_announcements;
create policy "Admins can view all hero announcements"
  on public.hero_announcements for select
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can insert hero announcements" on public.hero_announcements;
create policy "Admins can insert hero announcements"
  on public.hero_announcements for insert
  with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
    and auth.uid() = created_by
  );

drop policy if exists "Admins can update hero announcements" on public.hero_announcements;
create policy "Admins can update hero announcements"
  on public.hero_announcements for update
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete hero announcements" on public.hero_announcements;
create policy "Admins can delete hero announcements"
  on public.hero_announcements for delete
  using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );
