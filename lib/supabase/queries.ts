import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AppNotification,
  AppUser,
  CrmConnection,
  EmailTemplate,
  Lead,
  LeadNote,
  Organization,
  OrganizationMember,
  Profile,
  ProfileVersion,
  SsoConnection,
  Webhook,
  Workflow,
} from "@/lib/supabase/types";

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (data) return data as AppUser;

  // Self-heal: handle_new_user should have created this row at signup, but
  // some accounts predate it or a trigger run can fail silently.
  const { data: created } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string | undefined) ?? null,
    })
    .select("*")
    .single();
  return (created as AppUser) ?? null;
}

export async function getIsPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
}

/** The first organization this user is an active member of. The app has no
 * org-switcher UI yet, so a single "current" org is a deliberate simplification. */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (membership) return (membership.organizations as unknown as Organization) ?? null;

  // Self-heal: accounts that predate a schema reset, or any signup path that
  // bypassed the trigger, get a personal organization created on demand.
  const { data: newOrgId } = await supabase.rpc("ensure_personal_organization");
  if (!newOrgId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", newOrgId)
    .single();
  return (org as Organization) ?? null;
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<(OrganizationMember & { user: AppUser | null })[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (!members || members.length === 0) return [];

  // organization_members.user_id references auth.users, not public.users, so
  // there's no FK path PostgREST can embed across — join in JS instead.
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in(
      "id",
      members.map((m) => m.user_id)
    );
  const usersById = new Map((users ?? []).map((u) => [u.id, u as AppUser]));

  return members.map((m) => ({ ...m, user: usersById.get(m.user_id) ?? null })) as (OrganizationMember & {
    user: AppUser | null;
  })[];
}

export async function getMyProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function getMyProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();
  return (data as Profile) ?? null;
}

export async function getPublishedProfileBySlug(slug: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();
  return (data as Profile) ?? null;
}

export type ViewMeta = {
  channel?: string | null;
  country?: string | null;
  device?: string | null;
  browser?: string | null;
};

export async function recordProfileView(profileId: string, meta: ViewMeta = {}) {
  const supabase = await createClient();
  await supabase.from("analytics_events").insert({
    profile_id: profileId,
    event_type: "view",
    channel: meta.channel ?? "lien_direct",
    country: meta.country ?? null,
    device: meta.device ?? null,
    browser: meta.browser ?? null,
  });
}

export async function getChannelBreakdown(
  profileIds: string[]
): Promise<{ channel: string; count: number }[]> {
  if (profileIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("channel")
    .eq("event_type", "view")
    .in("profile_id", profileIds);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.channel ?? "lien_direct";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getDeviceBreakdown(
  profileIds: string[]
): Promise<{ device: string; count: number }[]> {
  if (profileIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("device")
    .eq("event_type", "view")
    .in("profile_id", profileIds);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.device ?? "Inconnu";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getCountryBreakdown(
  profileIds: string[]
): Promise<{ country: string; count: number }[]> {
  if (profileIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("country")
    .eq("event_type", "view")
    .in("profile_id", profileIds);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.country ?? "Inconnu";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

export type LeadWithNotes = Lead & { lead_notes: LeadNote[] };

export async function getMyLeads(): Promise<LeadWithNotes[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*, lead_notes(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data as LeadWithNotes[]) ?? [];
}

export async function getMyWorkflows(): Promise<Workflow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Workflow[]) ?? [];
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as EmailTemplate[]) ?? [];
}

export async function getWebhooks(): Promise<Webhook[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Webhook[]) ?? [];
}

export async function getAnalyticsCounts(profileIds: string[]) {
  const counts = { view: 0, click: 0, download: 0, save_contact: 0 };
  if (profileIds.length === 0) return counts;

  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("event_type")
    .in("profile_id", profileIds);

  for (const row of data ?? []) {
    const type = row.event_type as keyof typeof counts;
    if (type in counts) counts[type] += 1;
  }
  return counts;
}

export async function getDailyViewCounts(
  profileIds: string[],
  days = 7
): Promise<{ date: string; count: number }[]> {
  const buckets: { date: string; count: number }[] = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
  if (profileIds.length === 0) return buckets;

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("created_at")
    .eq("event_type", "view")
    .in("profile_id", profileIds)
    .gte("created_at", since.toISOString());

  const byDate = new Map(buckets.map((b) => [b.date, b]));
  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export async function getViewCountsByProfile(profileIds: string[]): Promise<Map<string, number>> {
  const byProfile = new Map<string, number>();
  if (profileIds.length === 0) return byProfile;

  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("profile_id")
    .eq("event_type", "view")
    .in("profile_id", profileIds);

  for (const row of data ?? []) {
    if (!row.profile_id) continue;
    byProfile.set(row.profile_id, (byProfile.get(row.profile_id) ?? 0) + 1);
  }
  return byProfile;
}

export async function getPlatformStats() {
  const supabase = await createClient();
  const [orgs, users, profiles, publishedProfiles] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  return {
    organizations: orgs.count ?? 0,
    users: users.count ?? 0,
    profiles: profiles.count ?? 0,
    publishedProfiles: publishedProfiles.count ?? 0,
  };
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Organization[]) ?? [];
}

export async function getAllUsers(): Promise<AppUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as AppUser[]) ?? [];
}

export async function getProfileVersions(profileId: string): Promise<ProfileVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_versions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as ProfileVersion[]) ?? [];
}

export async function getCrmConnections(organizationId: string): Promise<CrmConnection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_connections")
    .select("id, organization_id, provider, status, created_at")
    .eq("organization_id", organizationId);
  return (data as CrmConnection[]) ?? [];
}

export async function getSsoConnections(organizationId: string): Promise<SsoConnection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sso_connections")
    .select("id, organization_id, provider, metadata_url, status, created_at")
    .eq("organization_id", organizationId);
  return (data as SsoConnection[]) ?? [];
}

export async function getMyNotifications(limit = 10): Promise<AppNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AppNotification[]) ?? [];
}
