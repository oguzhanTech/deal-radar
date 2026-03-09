-- Award 7 points to deal owner when a deal is approved
-- - On INSERT with status = 'approved' (güvenilir paylaşımcılar için)
-- - On UPDATE where status changes to 'approved' (admin onayı)

create or replace function on_deal_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  deal_owner uuid;
begin
  if TG_OP = 'INSERT' then
    if NEW.status = 'approved' then
      select created_by into deal_owner from public.deals where id = NEW.id;
      if deal_owner is not null then
        perform award_points(deal_owner, 7);
        perform check_badges(deal_owner);
      end if;
    end if;
  elsif TG_OP = 'UPDATE' then
    if NEW.status = 'approved' and OLD.status <> 'approved' then
      select created_by into deal_owner from public.deals where id = NEW.id;
      if deal_owner is not null then
        perform award_points(deal_owner, 7);
        perform check_badges(deal_owner);
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_deal_status_changed on public.deals;
create trigger on_deal_status_changed
  after insert or update of status on public.deals
  for each row
  execute function on_deal_status_change();

