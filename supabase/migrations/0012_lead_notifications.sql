-- Creates an in-app notification for a card's owner whenever a new lead is
-- captured on their profile. Runs as a SECURITY DEFINER AFTER INSERT trigger
-- because the inserting client is the anonymous public-page visitor (no
-- auth.uid()), who has no RLS path to write a notifications row for someone
-- else — the owner_id here is derived server-side from the profile being
-- submitted to, never from client input, mirroring set_lead_organization_id.

create function public.notify_lead_captured()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_profile_name text;
begin
  if new.profile_id is null then
    return new;
  end if;

  select owner_id, full_name into v_owner_id, v_profile_name
  from public.profiles where id = new.profile_id;

  if v_owner_id is not null then
    insert into public.notifications (user_id, type, payload)
    values (
      v_owner_id,
      'lead_captured',
      jsonb_build_object(
        'lead_id', new.id,
        'lead_name', new.name,
        'profile_id', new.profile_id,
        'profile_name', v_profile_name,
        'channel', new.channel
      )
    );
  end if;

  return new;
end;
$$;

create trigger notify_lead_captured_trigger
  after insert on public.leads
  for each row execute procedure public.notify_lead_captured();
