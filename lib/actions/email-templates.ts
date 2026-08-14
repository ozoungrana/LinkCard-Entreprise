"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";

export type EmailTemplateActionResult = { error: string } | undefined;

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [];
  const names = matches.map((m) => m.replace(/[{}]/g, "").trim());
  return Array.from(new Set(names));
}

export async function createEmailTemplate(
  name: string,
  subject: string,
  body: string
): Promise<EmailTemplateActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };
  if (!name.trim() || !subject.trim() || !body.trim()) {
    return { error: "Nom, objet et contenu sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("email_templates").insert({
    organization_id: organization.id,
    name: name.trim(),
    subject: subject.trim(),
    body: body.trim(),
    variables: extractVariables(body),
  });
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function updateEmailTemplate(
  id: string,
  name: string,
  subject: string,
  body: string
): Promise<EmailTemplateActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };
  if (!name.trim() || !subject.trim() || !body.trim()) {
    return { error: "Nom, objet et contenu sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      variables: extractVariables(body),
    })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function deleteEmailTemplate(id: string): Promise<EmailTemplateActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}
