"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import type { WebhookEvent } from "@/lib/supabase/types";

export type WebhookActionResult = { error: string } | undefined;

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createWebhook(
  url: string,
  events: WebhookEvent[]
): Promise<WebhookActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };
  if (!isValidHttpsUrl(url)) return { error: "L'URL doit être une adresse https:// valide." };
  if (events.length === 0) return { error: "Sélectionne au moins un événement." };

  const supabase = await createClient();
  const { error } = await supabase.from("webhooks").insert({
    organization_id: organization.id,
    url,
    events,
    is_active: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function toggleWebhook(id: string, isActive: boolean): Promise<WebhookActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function deleteWebhook(id: string): Promise<WebhookActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) return { error: error.message };

  revalidatePath("/automations");
}

export async function testWebhook(
  id: string,
  url: string
): Promise<{ error: string } | { success: true; statusCode: number }> {
  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };
  if (!isValidHttpsUrl(url)) return { error: "URL invalide." };

  const startedAt = Date.now();
  let statusCode: number;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test",
        organization_id: organization.id,
        sent_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    statusCode = response.status;
  } catch {
    return { error: "Impossible de joindre cette URL (timeout ou connexion refusée)." };
  }

  const supabase = await createClient();
  await supabase.from("webhook_logs").insert({
    webhook_id: id,
    event: "test",
    status_code: statusCode,
    response_time_ms: Date.now() - startedAt,
  });

  if (statusCode >= 200 && statusCode < 300) {
    return { success: true, statusCode };
  }
  return { error: `Le serveur a répondu avec le code ${statusCode}.` };
}
