"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import type { WorkflowActionType } from "@/lib/supabase/types";

export type WorkflowStepActionResult = { error: string } | undefined;

export async function addWorkflowStep(
  workflowId: string,
  actionType: WorkflowActionType,
  config: Record<string, unknown>
): Promise<WorkflowStepActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const supabase = await createClient();
  const { data: workflow } = await supabase
    .from("workflows")
    .select("id")
    .eq("id", workflowId)
    .eq("organization_id", organization.id)
    .single();
  if (!workflow) return { error: "Workflow introuvable." };

  const { count } = await supabase
    .from("workflow_steps")
    .select("*", { count: "exact", head: true })
    .eq("workflow_id", workflowId);

  const { error } = await supabase.from("workflow_steps").insert({
    workflow_id: workflowId,
    position: (count ?? 0) + 1,
    action_type: actionType,
    config,
  });
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function deleteWorkflowStep(stepId: string): Promise<WorkflowStepActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const supabase = await createClient();
  const { error } = await supabase.from("workflow_steps").delete().eq("id", stepId);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}
