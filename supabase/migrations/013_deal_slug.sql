-- SEO: benzersiz fırsat slug'ı (/firsat/{slug})

alter table public.deals add column if not exists slug text;

-- Başlıktan URL güvenli parça (Türkçe harfler sadeleştirilir)
create or replace function public.slugify_deal_title(raw text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  if raw is null or trim(raw) = '' then
    return 'firsat';
  end if;
  s := lower(trim(raw));
  s := translate(s,
    'ğüşöçıİĞÜŞÖÇ',
    'gusocigusoc'
  );
  s := translate(s, 'âîûÂÎÛéèêëáàäóòôõúùûñ', 'aiuaiueeeaaaooouuun');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  s := regexp_replace(s, '-{2,}', '-', 'g');
  if s = '' then
    s := 'firsat';
  end if;
  if length(s) > 80 then
    s := left(s, 80);
    s := trim(both '-' from regexp_replace(s, '-[^-]*$', ''));
    if s = '' then s := 'firsat'; end if;
  end if;
  return s;
end;
$$;

-- Mevcut satırlar: başlık slug + kısa id parçası (benzersizlik garantisi)
update public.deals d
set slug = left(public.slugify_deal_title(d.title), 72) || '-' || substr(replace(d.id::text, '-', ''), 1, 10)
where d.slug is null;

alter table public.deals alter column slug set not null;

create unique index if not exists idx_deals_slug on public.deals(slug);
