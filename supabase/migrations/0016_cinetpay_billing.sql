-- CinetPay mobile money billing (Orange Money, MTN Money, Moov, Wave), as an
-- alternative to Stripe (0011) for the same Pro/Business plans. Unlike
-- Stripe, CinetPay has no native recurring subscription: a successful
-- payment grants the plan for a fixed period, tracked via
-- organizations.plan_expires_at. The Inngest cron in lib/inngest/functions.ts
-- (check-cinetpay-expirations) downgrades orgs past that date back to free
-- and reminds admins a few days ahead, mirroring what Stripe's webhook does
-- live for card subscriptions.

alter table public.organizations
  add column plan_expires_at timestamptz,
  add column payment_provider text check (payment_provider in ('stripe', 'cinetpay'));

create table public.cinetpay_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transaction_id text unique not null,
  plan org_plan not null,
  seats int not null default 1,
  amount numeric not null,
  currency text not null default 'XOF',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'refused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cinetpay_transactions_organization_id_idx on public.cinetpay_transactions (organization_id);

alter table public.cinetpay_transactions enable row level security;

-- Insert happens client-side (the org member starting checkout); status
-- transitions happen server-to-server from the webhook, which authenticates
-- as service_role and therefore bypasses RLS entirely — no update policy is
-- needed or granted to org members, mirroring how Stripe's webhook writes
-- through sync_organization_plan rather than a direct table grant.
create policy "org_members_can_read_cinetpay_transactions"
  on public.cinetpay_transactions for select
  using (public.is_org_member(organization_id));

create policy "org_members_can_create_cinetpay_transactions"
  on public.cinetpay_transactions for insert
  with check (public.is_org_member(organization_id));

create policy "platform_admins_bypass_cinetpay_transactions"
  on public.cinetpay_transactions for all
  using (public.is_platform_admin());

-- SECURITY DEFINER RPC the CinetPay webhook calls after independently
-- re-verifying the transaction status via CinetPay's own check-status API
-- (never trusting the notify payload alone) — same pattern and same
-- service_role-only grant as sync_organization_plan (0011).
create function public.apply_cinetpay_plan(
  p_organization_id uuid,
  p_plan org_plan,
  p_seats_limit int,
  p_expires_at timestamptz
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
      plan_expires_at = p_expires_at,
      payment_provider = 'cinetpay',
      updated_at = now()
  where id = p_organization_id;
end;
$$;

revoke all on function public.apply_cinetpay_plan from public, anon, authenticated;
grant execute on function public.apply_cinetpay_plan to service_role;
