-- Editör'ün seçimi: anasayfada tek deal göstermek için
alter table public.deals
  add column if not exists is_editor_pick boolean not null default false;
