-- Bitiş tarihi belli olmayan fırsatlar: 5 gün sonra review_needed
-- deals.end_date_unknown ekle, status check'e review_needed ekle

alter table public.deals
  add column if not exists end_date_unknown boolean not null default false;

alter table public.deals
  drop constraint if exists deals_status_check;

alter table public.deals
  add constraint deals_status_check
  check (status in ('pending', 'approved', 'rejected', 'review_needed'));
