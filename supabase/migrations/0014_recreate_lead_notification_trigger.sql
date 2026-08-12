-- Re-attaches the trigger dropped during diagnosis of the reciprocal-form
-- bug. The real root cause was unrelated (see submitReciprocalLead in
-- lib/actions/leads.ts — a PostgREST insert+select-under-RLS gotcha), so
-- this notification trigger is safe to restore as-is; the function body
-- already has the fail-safe exception handler from migration 0013.

create trigger notify_lead_captured_trigger
  after insert on public.leads
  for each row execute procedure public.notify_lead_captured();
