-- LinkCard Enterprise — initial schema
-- Mirrors the data model in CLAUDE.md §3. Run this once in the Supabase SQL Editor
-- (or via `supabase db push` once the project is linked).

create extension if not exists "pgcrypto";

-- ============================================================================
-- Tables
-- ============================================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business', 'enterprise')),
  logo_url text,
  brand_primary_color text,
  brand_secondary_color text,
  layout_locked boolean not null default false,
  scim_endpoint text,
  sso_provider text check (sso_provider in ('google', 'entra', 'okta')),
  created_at timestamptz not null default now()
);

-- App-level user record, 1:1 with auth.users. Populated by the trigger below.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('super_admin', 'org_admin', 'user', 'reader')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- "Cartes" — a user can own several.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  slug text unique,
  name text not null,
  type text not null default 'freelance' check (type in ('entreprise', 'freelance', 'conference', 'custom')),
  full_name text,
  job_title text,
  company text,
  phone text,
  email text,
  address text,
  website_url text,
  linkedin_url text,
  calendly_url text,
  portfolio_url text,
  brand_primary_color text,
  brand_secondary_color text,
  font text,
  template text,
  avatar_url text,
  cover_video_url text,
  audio_intro_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  widget_order jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  snapshot jsonb not null,
  change_summary text,
  created_at timestamptz not null default now()
);

-- Captured contacts.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  captured_by_user_id uuid references public.users (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  company text,
  email text,
  phone text,
  channel text check (channel in ('qr', 'nfc', 'email', 'lien', 'ocr')),
  stage text not null default 'nouveau'
    check (stage in ('nouveau', 'contacte', 'qualifie', 'proposition', 'client', 'perdu')),
  tags text[] not null default '{}',
  notes text,
  voice_note_url text,
  meeting_location text,
  meeting_at timestamptz,
  consent_given boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trigger_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  position int not null,
  action_type text not null,
  config jsonb not null default '{}'::jsonb
);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  triggered_by text,
  status text not null check (status in ('success', 'failed')),
  duration_ms int,
  created_at timestamptz not null default now()
);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.crm_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('hubspot', 'salesforce', 'pipedrive', 'zoho')),
  status text not null default 'disconnected',
  credentials text, -- encrypted at the application layer before storage
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('view', 'click', 'download', 'save_contact')),
  channel text,
  country text,
  device text,
  browser text,
  created_at timestamptz not null default now()
);

create index leads_organization_id_idx on public.leads (organization_id);
create index profiles_user_id_idx on public.profiles (user_id);
create index analytics_events_profile_id_idx on public.analytics_events (profile_id);
create index analytics_events_created_at_idx on public.analytics_events (created_at);

-- ============================================================================
-- New auth user → public.users row
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

create function public.current_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid();
$$;

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_versions enable row level security;
alter table public.leads enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.email_templates enable row level security;
alter table public.crm_connections enable row level security;
alter table public.analytics_events enable row level security;

-- organizations: members can see their own org.
create policy "Members can view their organization"
  on public.organizations for select
  using (id = public.current_organization_id());

create policy "Org admins can update their organization"
  on public.organizations for update
  using (
    id = public.current_organization_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('org_admin', 'super_admin')
    )
  );

-- users: see your own row and your org's members.
create policy "Users can view themselves and org members"
  on public.users for select
  using (id = auth.uid() or organization_id = public.current_organization_id());

create policy "Users can update their own row"
  on public.users for update
  using (id = auth.uid());

-- profiles ("cartes"): publicly readable when published (the visitor journey
-- must work with zero auth); owners manage their own.
create policy "Anyone can view published profiles"
  on public.profiles for select
  using (status = 'published');

create policy "Owners can view their own profiles"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "Owners can manage their own profiles"
  on public.profiles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- profile_versions: owner only.
create policy "Owners can view their profile history"
  on public.profile_versions for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = profile_versions.profile_id and profiles.user_id = auth.uid()
  ));

create policy "Owners can create profile versions"
  on public.profile_versions for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = profile_versions.profile_id and profiles.user_id = auth.uid()
  ));

-- leads: scoped to the organization; the capturing user or org members can manage.
create policy "Org members can view leads"
  on public.leads for select
  using (organization_id = public.current_organization_id());

create policy "Org members can manage leads"
  on public.leads for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- The public reciprocal form on a card's page must be able to create a lead
-- without being authenticated.
create policy "Anyone can submit a lead via the reciprocal form"
  on public.leads for insert
  with check (consent_given = true);

-- workflows / steps / executions / templates / crm connections: org-scoped.
create policy "Org members can manage workflows"
  on public.workflows for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "Org members can manage workflow steps"
  on public.workflow_steps for all
  using (exists (
    select 1 from public.workflows
    where workflows.id = workflow_steps.workflow_id
      and workflows.organization_id = public.current_organization_id()
  ))
  with check (exists (
    select 1 from public.workflows
    where workflows.id = workflow_steps.workflow_id
      and workflows.organization_id = public.current_organization_id()
  ));

create policy "Org members can view workflow executions"
  on public.workflow_executions for select
  using (exists (
    select 1 from public.workflows
    where workflows.id = workflow_executions.workflow_id
      and workflows.organization_id = public.current_organization_id()
  ));

create policy "Org members can manage email templates"
  on public.email_templates for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "Org members can manage crm connections"
  on public.crm_connections for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- analytics_events: anyone (including anonymous visitors) can record a view/click
-- on a published card; only the owner can read the data back.
create policy "Anyone can record an analytics event"
  on public.analytics_events for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = analytics_events.profile_id and profiles.status = 'published'
  ));

create policy "Owners can view their analytics"
  on public.analytics_events for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = analytics_events.profile_id and profiles.user_id = auth.uid()
  ));
