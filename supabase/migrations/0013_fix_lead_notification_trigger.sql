-- The notify_lead_captured trigger (0012) was breaking the reciprocal-form
-- lead insert entirely: when the notifications insert inside it failed for
-- any reason, the exception propagated up and rolled back the whole leads
-- INSERT, surfacing as a generic RLS-violation error to the anonymous
-- visitor. A notification is a side effect, not a hard requirement for lead
-- capture — never let it block the primary insert.

create or replace function public.notify_lead_captured()
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
    begin
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
    exception when others then
      raise warning 'notify_lead_captured: notification insert failed (%): %', sqlstate, sqlerrm;
    end;
  end if;

  return new;
end;
$$;
