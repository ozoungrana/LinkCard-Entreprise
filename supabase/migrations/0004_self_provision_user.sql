-- Defensive fallback for public.users rows that the handle_new_user trigger
-- didn't create (e.g. accounts that predate the trigger, or any signup path
-- that bypasses it). Lets an authenticated user create their own row.

create policy "Users can create their own row"
  on public.users for insert
  with check (id = auth.uid());
