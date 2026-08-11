-- Security-definer helpers used throughout RLS policies (0008), plus the
-- signup trigger that auto-creates a personal organization per §1.2 of
-- Docs/blueprint-chapitre-9-modele-donnees.md ("les indépendants sont
-- rattachés à une organisation personnelle créée automatiquement").

create function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid() and status = 'active'
  );
$$;

create function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid() and status = 'active'
      and role in ('org_admin', 'team_admin')
  );
$$;

-- is_platform_admin reads auth.users.raw_app_meta_data directly rather than a
-- public.users column: app_metadata can only be written by the service role,
-- so a user can never grant themselves platform-admin access.
create function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select (raw_app_meta_data ->> 'is_platform_admin')::boolean from auth.users where id = auth.uid()),
    false
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));

  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');

  insert into public.organizations (name, slug, is_personal, plan)
  values (
    display_name || '''s workspace',
    'org-' || replace(new.id::text, '-', ''),
    true,
    'free'
  )
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role, status, joined_at)
  values (new_org_id, new.id, 'org_admin', 'active', now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The public reciprocal form is submitted by an anonymous visitor, so the
-- client can never be trusted to set organization_id itself — derive it
-- server-side from the profile the lead was captured through.
create function public.set_lead_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id is not null then
    select organization_id into new.organization_id
    from public.profiles where id = new.profile_id;
  end if;
  return new;
end;
$$;

create trigger set_lead_organization_id_trigger
  before insert on public.leads
  for each row execute procedure public.set_lead_organization_id();
