-- Editör yorumu ve seçimi yapan admin
alter table public.deals
  add column if not exists editor_pick_quote text,
  add column if not exists editor_pick_set_by uuid references auth.users(id) on delete set null;
