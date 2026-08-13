"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import type { Organization } from "@/lib/supabase/types";

export type WorkflowActionResult = { error: string } | undefined;

// Chapter 10 §2: Free has no automations at all; Pro is capped at 1 active
// workflow; Business/Enterprise are unlimited. Returned as a message rather
// than thrown — Server Action errors are redacted to a generic digest in
// production, which would hide the upgrade hint from the user.
async function checkCanActivateWorkflow(organization: Organization): Promise<string | null> {
  if (organization.plan === "free") {
    return "Les automatisations ne sont pas disponibles sur le plan Free. Passe à Pro pour en profiter.";
  }
  if (organization.plan === "pro") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true);
    if ((count ?? 0) >= 1) {
      return "Le plan Pro est limité à 1 workflow actif. Passe à Business pour des automatisations illimitées.";
    }
  }
  return null;
}

export async function createWorkflow(name: string): Promise<WorkflowActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const limitError = await checkCanActivateWorkflow(organization);
  if (limitError) return { error: limitError };

  const supabase = await createClient();
  const { error } = await supabase.from("workflows").insert({
    organization_id: organization.id,
    name,
    trigger_type: "lead_captured",
    is_active: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function toggleWorkflow(workflowId: string, isActive: boolean): Promise<WorkflowActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  if (isActive) {
    const limitError = await checkCanActivateWorkflow(organization);
    if (limitError) return { error: limitError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflows")
    .update({ is_active: isActive })
    .eq("id", workflowId)
    .eq("organization_id", organization.id);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}
