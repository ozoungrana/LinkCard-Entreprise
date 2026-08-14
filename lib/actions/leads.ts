"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import { inngest } from "@/lib/inngest/client";
import type { Lead } from "@/lib/supabase/types";

// Never let workflow-trigger delivery block or fail a lead capture — the
// engine (and its INNGEST_EVENT_KEY) may not be configured yet, and even
// when it is, this is a fire-and-forget side effect, not the source of truth.
function notifyLeadCaptured(data: {
  leadId: string;
  organizationId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}) {
  inngest.send({ name: "lead/captured", data }).catch(() => {});
}

export type SubmitLeadState = { error?: string; success?: boolean } | undefined;

export type CreateLeadInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

// Field capture — a rep logging a contact met in person, not tied to a
// specific card. Returned as {error}/{success} rather than thrown: this is
// also called from the offline sync flow, which needs to tell failures
// apart from successes without relying on production error redaction.
export async function createLeadManually(
  input: CreateLeadInput
): Promise<{ error: string } | { success: true; id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const name = input.name.trim();
  if (!name) return { error: "Le nom est requis." };

  const leadId = crypto.randomUUID();
  const company = input.company?.trim() || null;
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;
  const { error } = await supabase.from("leads").insert({
    id: leadId,
    organization_id: organization.id,
    captured_by: user.id,
    name,
    company,
    email,
    phone,
    channel: "manuel",
    consent_given: true,
  });

  if (error) return { error: error.message };

  if (input.notes?.trim()) {
    await supabase.from("lead_notes").insert({
      lead_id: leadId,
      author_id: user.id,
      type: "text",
      content: input.notes.trim(),
    });
  }

  notifyLeadCaptured({ leadId, organizationId: organization.id, name, company, email, phone });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { success: true, id: leadId };
}

export type ImportLeadRow = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
};

export async function importLeadsCsv(
  rows: ImportLeadRow[]
): Promise<{ error: string } | { success: true; imported: number; skipped: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const valid = rows.filter((r) => r.name?.trim());
  const skipped = rows.length - valid.length;
  if (valid.length === 0) return { error: "Aucune ligne valide (le nom est requis)." };

  const payload = valid.map((r) => ({
    id: crypto.randomUUID(),
    organization_id: organization.id,
    captured_by: user.id,
    name: r.name.trim(),
    company: r.company?.trim() || null,
    email: r.email?.trim() || null,
    phone: r.phone?.trim() || null,
    channel: "import_csv" as const,
    consent_given: true,
  }));

  const { error } = await supabase.from("leads").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { success: true, imported: valid.length, skipped };
}

export async function deleteLead(leadId: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // Delete is gated to org admins by RLS (org_admins_can_delete_leads); a
  // member without that role matches zero rows rather than erroring, so the
  // empty return is the only signal to tell "not found" from "not allowed".
  const { data, error } = await supabase.from("leads").delete().eq("id", leadId).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return {
      error: "Seuls les administrateurs de l'organisation peuvent supprimer un contact.",
    };
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
}

export async function updateLeadStage(leadId: string, stage: Lead["stage"]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { error } = await supabase.from("leads").update({ stage }).eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/contacts");
}

export async function submitReciprocalLead(
  profileId: string,
  _prevState: SubmitLeadState,
  formData: FormData
): Promise<SubmitLeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const consent = formData.get("consent");

  if (!name || !/\S+@\S+\.\S+/.test(email) || !consent) {
    return {
      error: "Merci de renseigner un nom, un email valide, et d'accepter le consentement.",
    };
  }

  // Deliberately no .select() after this insert: chaining one would make
  // PostgREST read the row back, which is gated by the SELECT policy
  // (org membership) — a genuinely anonymous visitor never satisfies that,
  // so the whole insert would fail even though the INSERT policy itself
  // allows it. Generating the id client-side sidesteps the read-back.
  const leadId = crypto.randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    id: leadId,
    profile_id: profileId,
    name,
    email,
    phone: phone || null,
    channel: "lien_direct",
    consent_given: true,
  });

  if (error) {
    return { error: "Échec de l'envoi, réessaie." };
  }

  // Public profile SELECT is allowed for anonymous visitors, so this lookup
  // works without a session; if it fails for any reason, just skip the
  // workflow trigger rather than affecting the lead submission.
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", profileId)
    .single();
  if (profile?.organization_id) {
    notifyLeadCaptured({
      leadId,
      organizationId: profile.organization_id,
      name,
      company: null,
      email,
      phone: phone || null,
    });
  }

  if (message) {
    await supabase.from("lead_notes").insert({
      lead_id: leadId,
      type: "text",
      content: message,
    });
  }

  return { success: true };
}
