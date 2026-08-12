"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/supabase/types";

export type SubmitLeadState = { error?: string; success?: boolean } | undefined;

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

  if (message) {
    await supabase.from("lead_notes").insert({
      lead_id: leadId,
      type: "text",
      content: message,
    });
  }

  return { success: true };
}
