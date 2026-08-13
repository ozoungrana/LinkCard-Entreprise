-- Manual lead capture from the field (a contact met in person, no
-- associated card/profile_id). The existing insert policy only covers the
-- anonymous reciprocal form (requires profile_id + consent) — org members
-- need their own path to log a contact directly.
alter type lead_channel add value if not exists 'manuel';

create policy "org_members_can_insert_leads"
  on public.leads for insert
  with check (public.is_org_member(organization_id));
