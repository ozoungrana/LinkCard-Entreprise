-- Lets a user with role = 'super_admin' read across every tenant, for the
-- platform-wide admin-saas dashboard. Additive: RLS combines multiple
-- policies for the same command with OR, so this only widens access.

create function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'super_admin'
  );
$$;

create policy "Super admins can view all organizations"
  on public.organizations for select
  using (public.is_super_admin());

create policy "Super admins can view all users"
  on public.users for select
  using (public.is_super_admin());

create policy "Super admins can view all profiles"
  on public.profiles for select
  using (public.is_super_admin());
