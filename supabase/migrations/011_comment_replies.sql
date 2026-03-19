-- One-level reply support for deal comments
alter table public.deal_comments
  add column if not exists parent_comment_id uuid null references public.deal_comments(id) on delete cascade;

create index if not exists idx_deal_comments_thread
  on public.deal_comments(deal_id, parent_comment_id, created_at);

