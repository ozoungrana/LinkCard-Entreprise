-- Reset before rebuilding on the chapter 9 schema (Docs/blueprint-chapitre-9-modele-donnees.md).
-- Safe: the project only holds test data at this point.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_organization_id() cascade;
drop function if exists public.is_super_admin() cascade;

drop table if exists public.analytics_events cascade;
drop table if exists public.crm_connections cascade;
drop table if exists public.email_templates cascade;
drop table if exists public.workflow_executions cascade;
drop table if exists public.workflow_steps cascade;
drop table if exists public.workflows cascade;
drop table if exists public.leads cascade;
drop table if exists public.profile_versions cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;
drop table if exists public.organizations cascade;
