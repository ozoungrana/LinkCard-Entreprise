-- RLS for every table, per §6 of Docs/blueprint-chapitre-9-modele-donnees.md:
-- "RLS activé sur toutes les tables sans exception". Org-scoping goes through
-- is_org_member/is_org_admin (0007) instead of inline subqueries on
-- organization_members, to avoid self-referential recursion on that table.

-- organizations ---------------------------------------------------------

alter table public.organizations enable row level security;

create policy "members_can_view_their_orgs"
  on public.organizations for select
  using (public.is_org_member(id) or public.is_platform_admin());

create policy "org_admins_can_update_their_org"
  on public.organizations for update
  using (public.is_org_admin(id));

create policy "platform_admins_manage_orgs"
  on public.organizations for all
  using (public.is_platform_admin());

-- organization_members ---------------------------------------------------

alter table public.organization_members enable row level security;

create policy "members_can_view_org_members"
  on public.organization_members for select
  using (public.is_org_member(organization_id) or user_id = auth.uid() or public.is_platform_admin());

create policy "org_admins_can_manage_members"
  on public.organization_members for all
  using (public.is_org_admin(organization_id) or public.is_platform_admin());

-- users (identity mirror) -------------------------------------------------

alter table public.users enable row level security;

create policy "users_can_view_themselves"
  on public.users for select
  using (id = auth.uid());

create policy "org_members_can_view_each_other"
  on public.users for select
  using (exists (
    select 1 from public.organization_members m1
    join public.organization_members m2 on m1.organization_id = m2.organization_id
    where m1.user_id = auth.uid() and m1.status = 'active'
      and m2.user_id = public.users.id and m2.status = 'active'
  ));

create policy "platform_admins_view_all_users"
  on public.users for select
  using (public.is_platform_admin());

create policy "users_can_update_themselves"
  on public.users for update
  using (id = auth.uid());

create policy "users_can_create_their_own_row"
  on public.users for insert
  with check (id = auth.uid());

-- profiles ("cartes") -----------------------------------------------------

alter table public.profiles enable row level security;

create policy "published_profiles_are_public"
  on public.profiles for select
  using (status = 'published' and deleted_at is null);

create policy "org_members_can_view_org_profiles"
  on public.profiles for select
  using (public.is_org_member(organization_id));

create policy "owners_can_manage_their_profiles"
  on public.profiles for all
  using (owner_id = auth.uid() or public.is_org_admin(organization_id) or public.is_platform_admin())
  with check (owner_id = auth.uid() or public.is_org_admin(organization_id) or public.is_platform_admin());

-- profile_versions ----------------------------------------------------------

alter table public.profile_versions enable row level security;

create policy "profile_stakeholders_can_view_versions"
  on public.profile_versions for select
  using (exists (
    select 1 from public.profiles
    where id = profile_versions.profile_id
      and (owner_id = auth.uid() or public.is_org_member(profiles.organization_id))
  ));

create policy "profile_owners_can_insert_versions"
  on public.profile_versions for insert
  with check (exists (
    select 1 from public.profiles where id = profile_versions.profile_id and owner_id = auth.uid()
  ));

-- nfc_cards / wallet_installs ----------------------------------------------

alter table public.nfc_cards enable row level security;

create policy "profile_stakeholders_manage_nfc_cards"
  on public.nfc_cards for all
  using (exists (
    select 1 from public.profiles
    where id = nfc_cards.profile_id
      and (owner_id = auth.uid() or public.is_org_member(profiles.organization_id))
  ));

alter table public.wallet_installs enable row level security;

create policy "profile_stakeholders_view_wallet_installs"
  on public.wallet_installs for select
  using (exists (
    select 1 from public.profiles
    where id = wallet_installs.profile_id
      and (owner_id = auth.uid() or public.is_org_member(profiles.organization_id))
  ));

create policy "anyone_can_record_a_wallet_install"
  on public.wallet_installs for insert
  with check (true);

-- tags / leads / lead_tags / lead_notes ------------------------------------

alter table public.tags enable row level security;

create policy "org_members_manage_tags"
  on public.tags for all
  using (public.is_org_member(organization_id));

alter table public.leads enable row level security;

create policy "org_members_can_read_leads"
  on public.leads for select
  using (public.is_org_member(organization_id));

create policy "org_members_can_update_leads"
  on public.leads for update
  using (public.is_org_member(organization_id));

create policy "org_admins_can_delete_leads"
  on public.leads for delete
  using (public.is_org_admin(organization_id));

create policy "anyone_can_submit_a_lead_via_reciprocal_form"
  on public.leads for insert
  with check (consent_given = true and profile_id is not null);

create policy "platform_admins_bypass_leads"
  on public.leads for all
  using (public.is_platform_admin());

alter table public.lead_tags enable row level security;

create policy "org_members_manage_lead_tags"
  on public.lead_tags for all
  using (exists (
    select 1 from public.leads where id = lead_tags.lead_id and public.is_org_member(leads.organization_id)
  ));

alter table public.lead_notes enable row level security;

create policy "org_members_manage_lead_notes"
  on public.lead_notes for all
  using (exists (
    select 1 from public.leads where id = lead_notes.lead_id and public.is_org_member(leads.organization_id)
  ));

-- Mirrors "anyone_can_submit_a_lead_via_reciprocal_form": lets the same
-- anonymous visitor attach their optional message to the lead they just
-- created (requires already knowing the lead's UUID, and only on leads that
-- carry consent).
create policy "anyone_can_add_a_note_via_reciprocal_form"
  on public.lead_notes for insert
  with check (exists (
    select 1 from public.leads where id = lead_notes.lead_id and consent_given = true
  ));

-- workflows / workflow_steps / workflow_executions -------------------------

alter table public.workflows enable row level security;

create policy "org_members_manage_workflows"
  on public.workflows for all
  using (public.is_org_member(organization_id));

alter table public.workflow_steps enable row level security;

create policy "org_members_manage_workflow_steps"
  on public.workflow_steps for all
  using (exists (
    select 1 from public.workflows
    where id = workflow_steps.workflow_id and public.is_org_member(workflows.organization_id)
  ));

alter table public.workflow_executions enable row level security;

create policy "org_members_view_workflow_executions"
  on public.workflow_executions for select
  using (exists (
    select 1 from public.workflows
    where id = workflow_executions.workflow_id and public.is_org_member(workflows.organization_id)
  ));

-- email_templates / webhooks / crm / sso -----------------------------------

alter table public.email_templates enable row level security;

create policy "org_members_manage_email_templates"
  on public.email_templates for all
  using (public.is_org_member(organization_id));

alter table public.webhooks enable row level security;

create policy "org_members_manage_webhooks"
  on public.webhooks for all
  using (public.is_org_member(organization_id));

alter table public.webhook_logs enable row level security;

create policy "org_members_view_webhook_logs"
  on public.webhook_logs for select
  using (exists (
    select 1 from public.webhooks
    where id = webhook_logs.webhook_id and public.is_org_member(webhooks.organization_id)
  ));

alter table public.crm_connections enable row level security;

create policy "org_members_manage_crm_connections"
  on public.crm_connections for all
  using (public.is_org_member(organization_id));

alter table public.crm_sync_logs enable row level security;

create policy "org_members_view_crm_sync_logs"
  on public.crm_sync_logs for select
  using (exists (
    select 1 from public.crm_connections
    where id = crm_sync_logs.crm_connection_id and public.is_org_member(crm_connections.organization_id)
  ));

alter table public.sso_connections enable row level security;

create policy "org_admins_manage_sso"
  on public.sso_connections for all
  using (public.is_org_admin(organization_id));

-- scim_events: append-only. No insert/update/delete policy for client roles
-- on purpose — SCIM provisioning writes go through the service role only.
alter table public.scim_events enable row level security;

create policy "org_admins_view_scim_events"
  on public.scim_events for select
  using (public.is_org_admin(organization_id));

-- analytics_events ----------------------------------------------------------

alter table public.analytics_events enable row level security;

create policy "anyone_can_record_an_analytics_event"
  on public.analytics_events for insert
  with check (exists (
    select 1 from public.profiles
    where id = analytics_events.profile_id and status = 'published' and deleted_at is null
  ));

create policy "profile_stakeholders_can_view_analytics"
  on public.analytics_events for select
  using (exists (
    select 1 from public.profiles
    where id = analytics_events.profile_id
      and (owner_id = auth.uid() or public.is_org_member(profiles.organization_id))
  ));

-- subscriptions / invoices: Stripe-webhook-written only (service role), read
-- restricted to org admins. No client-writable insert/update policy.
alter table public.subscriptions enable row level security;

create policy "org_admins_view_subscription"
  on public.subscriptions for select
  using (public.is_org_admin(organization_id));

alter table public.invoices enable row level security;

create policy "org_admins_view_invoices"
  on public.invoices for select
  using (public.is_org_admin(organization_id));

-- notifications ---------------------------------------------------------

alter table public.notifications enable row level security;

create policy "users_manage_their_notifications"
  on public.notifications for all
  using (user_id = auth.uid());

-- audit_logs: append-only, platform-admin read only. No client insert policy
-- — written via service role / security-definer functions only.
alter table public.audit_logs enable row level security;

create policy "platform_admins_view_audit_logs"
  on public.audit_logs for select
  using (public.is_platform_admin());

-- feature_flags -----------------------------------------------------------

alter table public.feature_flags enable row level security;

create policy "anyone_can_read_feature_flags"
  on public.feature_flags for select
  using (true);

create policy "platform_admins_manage_feature_flags"
  on public.feature_flags for all
  using (public.is_platform_admin());

-- support_tickets -----------------------------------------------------------

alter table public.support_tickets enable row level security;

create policy "org_members_view_their_tickets"
  on public.support_tickets for select
  using (organization_id is null or public.is_org_member(organization_id) or public.is_platform_admin());

create policy "org_members_create_tickets"
  on public.support_tickets for insert
  with check (organization_id is null or public.is_org_member(organization_id));

create policy "platform_admins_manage_tickets"
  on public.support_tickets for all
  using (public.is_platform_admin());

-- marketplace_themes --------------------------------------------------------

alter table public.marketplace_themes enable row level security;

create policy "anyone_can_view_marketplace_themes"
  on public.marketplace_themes for select
  using (true);

create policy "platform_admins_manage_marketplace_themes"
  on public.marketplace_themes for all
  using (public.is_platform_admin());
