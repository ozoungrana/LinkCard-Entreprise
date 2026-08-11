-- Full schema per Docs/blueprint-chapitre-9-modele-donnees.md.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums (§2)
-- ============================================================================

create type org_plan as enum ('free', 'pro', 'business', 'enterprise');
create type org_role as enum ('org_admin', 'team_admin', 'member', 'reader');
create type profile_type as enum ('entreprise', 'freelance', 'conference', 'custom');
create type profile_status as enum ('draft', 'published', 'archived');
create type lead_channel as enum ('qr', 'nfc', 'email_signature', 'lien_direct', 'ocr', 'import_csv');
create type lead_stage as enum ('nouveau', 'contacte', 'qualifie', 'proposition', 'client', 'perdu');
create type workflow_action_type as enum ('create_crm_contact', 'send_email', 'notify_slack', 'notify_teams', 'webhook_call', 'wait');
create type execution_status as enum ('success', 'failed', 'running');
create type sso_provider as enum ('google_workspace', 'microsoft_entra_id', 'okta');
create type crm_provider as enum ('hubspot', 'salesforce', 'pipedrive', 'zoho', 'dynamics');
create type notification_type as enum ('lead_captured', 'card_viewed', 'workflow_failed', 'workflow_succeeded', 'reminder_due', 'system');

-- ============================================================================
-- Organizations & membership (§4)
-- ============================================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan org_plan not null default 'free',
  seats_limit int default 1,
  logo_url text,
  brand_primary_color text default '#2563EB',
  brand_secondary_color text default '#7C3AED',
  layout_locked boolean default false,
  is_personal boolean default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role org_role not null default 'member',
  status text not null default 'invited' check (status in ('active', 'invited', 'suspended')),
  invited_by uuid references auth.users (id),
  provisioned_via_scim boolean default false,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Thin RLS-queryable mirror of auth.users (which client roles can't query
-- directly). is_platform_admin deliberately lives only in
-- auth.users.raw_app_meta_data (service-role-only write) — never here, or a
-- self-update policy would let a user grant themselves platform admin.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Profiles — "cartes" (§4)
-- ============================================================================

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  type profile_type not null default 'entreprise',
  status profile_status not null default 'draft',
  slug text unique not null,
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
  font text default 'Manrope',
  template text default 'corporate',
  avatar_url text,
  cover_video_url text,
  audio_intro_url text,
  widget_order jsonb not null default '[]'::jsonb,
  qr_public boolean default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);
create index profiles_owner_id_idx on public.profiles (owner_id);

create table public.profile_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  snapshot jsonb not null,
  change_summary text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index profile_versions_profile_id_idx on public.profile_versions (profile_id, created_at desc);

create table public.nfc_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  uid_hex text not null,
  last_written_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.wallet_installs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  wallet_type text not null check (wallet_type in ('apple', 'google')),
  push_token text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Leads / contacts (§4)
-- ============================================================================

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (organization_id, name)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  captured_by uuid references auth.users (id),
  name text not null,
  company text,
  email text,
  phone text,
  channel lead_channel not null,
  stage lead_stage not null default 'nouveau',
  meeting_location text,
  meeting_at timestamptz,
  consent_given boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_id_stage_idx on public.leads (organization_id, stage);
create index leads_captured_by_idx on public.leads (captured_by);

create table public.lead_tags (
  lead_id uuid not null references public.leads (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (lead_id, tag_id)
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id),
  type text not null default 'text' check (type in ('text', 'voice')),
  content text,
  audio_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Workflows (§4)
-- ============================================================================

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trigger_type text not null,
  is_active boolean default false,
  created_by uuid references auth.users (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  position int not null,
  action_type workflow_action_type not null,
  config jsonb not null default '{}',
  unique (workflow_id, position)
);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  triggered_by_lead_id uuid references public.leads (id),
  status execution_status not null,
  duration_ms int,
  error_message text,
  created_at timestamptz default now()
);

create index workflow_executions_workflow_id_idx on public.workflow_executions (workflow_id, created_at desc);

-- ============================================================================
-- Secondary tables (§5)
-- ============================================================================

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  url text not null,
  events text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks (id) on delete cascade,
  event text not null,
  status_code int,
  response_time_ms int,
  created_at timestamptz not null default now()
);

create table public.crm_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider crm_provider not null,
  status text not null default 'disconnected',
  credentials text, -- encrypt via Supabase Vault before storing
  created_at timestamptz not null default now()
);

create table public.crm_sync_logs (
  id uuid primary key default gen_random_uuid(),
  crm_connection_id uuid not null references public.crm_connections (id) on delete cascade,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create table public.sso_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider sso_provider not null,
  metadata_url text,
  status text not null default 'disconnected',
  created_at timestamptz not null default now()
);

create table public.scim_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null,
  external_user_id text,
  result text,
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

create index analytics_events_profile_id_idx on public.analytics_events (profile_id);
create index analytics_events_created_at_idx on public.analytics_events (created_at);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_invoice_id text unique,
  amount_cents int not null,
  status text not null,
  issued_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  rollout_percentage int not null default 0,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  subject text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.marketplace_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  is_premium boolean not null default false,
  preview_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
