-- Solo/B2C users have organization_id = null (see CLAUDE.md §3), so the
-- org-scoped policy on public.leads never matches for them. Add a policy so
-- profile owners can always see leads captured on their own cards, regardless
-- of organization membership.

create policy "Profile owners can view their leads"
  on public.leads for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = leads.profile_id and profiles.user_id = auth.uid()
  ));

create policy "Profile owners can update their leads"
  on public.leads for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = leads.profile_id and profiles.user_id = auth.uid()
  ));
