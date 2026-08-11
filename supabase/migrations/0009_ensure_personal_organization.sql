-- Self-heal fallback for accounts whose organization membership is missing —
-- e.g. accounts that predate a schema reset, or any signup path that
-- bypasses handle_new_user. Mirrors that trigger's personal-org logic, but
-- callable on demand by the authenticated user themselves.

create function public.ensure_personal_organization()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_org_id uuid;
  new_org_id uuid;
  display_name text;
  user_email text;
begin
  select organization_id into existing_org_id
  from public.organization_members
  where user_id = auth.uid() and status = 'active'
  order by joined_at asc
  limit 1;

  if existing_org_id is not null then
    return existing_org_id;
  end if;

  select email into user_email from auth.users where id = auth.uid();
  display_name := coalesce(
    (select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid()),
    split_part(user_email, '@', 1)
  );

  insert into public.organizations (name, slug, is_personal, plan)
  values (
    display_name || '''s workspace',
    'org-' || replace(auth.uid()::text, '-', ''),
    true,
    'free'
  )
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role, status, joined_at)
  values (new_org_id, auth.uid(), 'org_admin', 'active', now());

  return new_org_id;
end;
$$;
