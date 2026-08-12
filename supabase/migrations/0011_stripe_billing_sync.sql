-- SECURITY DEFINER RPC the Stripe webhook handler calls to sync an
-- organization's plan/seats after a checkout or subscription event. The
-- webhook route has no authenticated Supabase user (Stripe calls it
-- server-to-server), so it can't rely on RLS/owner checks.
--
-- IMPORTANT: execute is granted to service_role ONLY. Granting this to
-- anon/authenticated would let anyone holding the public anon key call it
-- directly via the REST RPC endpoint and upgrade any organization's plan for
-- free — the anon key is public client-side information, not a secret. The
-- webhook route must use the Supabase SERVICE ROLE key to call this, never
-- the anon/publishable key.

create function public.sync_organization_plan(
  p_organization_id uuid,
  p_plan org_plan,
  p_seats_limit int,
  p_stripe_customer_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.organizations
  set plan = p_plan,
      seats_limit = p_seats_limit,
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
      updated_at = now()
  where id = p_organization_id;
end;
$$;

revoke all on function public.sync_organization_plan from public, anon, authenticated;
grant execute on function public.sync_organization_plan to service_role;
