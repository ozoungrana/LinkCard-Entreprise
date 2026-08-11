"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import type { Organization } from "@/lib/supabase/types";

// Chapter 10 §2: Free has no automations at all; Pro is capped at 1 active
// workflow; Business/Enterprise are unlimited.
async function assertCanActivateWorkflow(organization: Organization) {
  if (organization.plan === "free") {
    throw new Error(
      "Les automatisations ne sont pas disponibles sur le plan Free. Passe à Pro pour en profiter."
    );
  }
  if (organization.plan === "pro") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true);
    if ((count ?? 0) >= 1) {
      throw new Error(
        "Le plan Pro est limité à 1 workflow actif. Passe à Business pour des automatisations illimitées."
      );
    }
  }
}

export async function createWorkflow(name: string) {
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("Aucune organisation associée à ce compte.");

  await assertCanActivateWorkflow(organization);

  const supabase = await createClient();
  const { error } = await supabase.from("workflows").insert({
    organization_id: organization.id,
    name,
    trigger_type: "lead_captured",
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/automations");
}

export async function toggleWorkflow(workflowId: string, isActive: boolean) {
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("Aucune organisation associée à ce compte.");

  if (isActive) {
    await assertCanActivateWorkflow(organization);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflows")
    .update({ is_active: isActive })
    .eq("id", workflowId)
    .eq("organization_id", organization.id);
  if (error) throw new Error(error.message);

  revalidatePath("/automations");
}
