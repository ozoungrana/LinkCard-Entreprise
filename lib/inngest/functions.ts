import { NonRetriableError } from "inngest";
import { inngest, type LeadCapturedData } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkflowStep } from "@/lib/supabase/types";

async function executeStep(step: WorkflowStep, lead: LeadCapturedData): Promise<void> {
  switch (step.action_type) {
    case "webhook_call":
    case "notify_slack":
    case "notify_teams": {
      const url =
        step.action_type === "webhook_call"
          ? String(step.config.url ?? "")
          : String(step.config.webhookUrl ?? "");
      if (!url) throw new NonRetriableError("URL manquante pour cette étape.");

      const payload =
        step.action_type === "webhook_call"
          ? { event: "lead_captured", lead }
          : {
              text: `Nouveau lead capturé : ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
            };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Réponse HTTP ${response.status}`);
      return;
    }
    case "send_email":
      throw new NonRetriableError(
        "Envoi d'email impossible : aucun fournisseur email n'est configuré."
      );
    case "create_crm_contact":
      throw new NonRetriableError(
        "Synchronisation CRM impossible : aucune connexion CRM active."
      );
    case "wait":
      // Handled in the function body via step.sleep, not here.
      return;
    default:
      throw new NonRetriableError(`Type d'étape inconnu : ${step.action_type}`);
  }
}

export const processLeadCaptured = inngest.createFunction(
  { id: "process-lead-captured", retries: 2, triggers: { event: "lead/captured" } },
  async ({ event, step }) => {
    const lead = event.data as LeadCapturedData;

    const workflows = await step.run("load-active-workflows", async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from("workflows")
        .select("*, workflow_steps(*)")
        .eq("organization_id", lead.organizationId)
        .eq("trigger_type", "lead_captured")
        .eq("is_active", true);
      return data ?? [];
    });

    for (const workflow of workflows) {
      const steps = ((workflow.workflow_steps as WorkflowStep[]) ?? []).sort(
        (a, b) => a.position - b.position
      );
      let failed = false;
      let errorMessage: string | null = null;
      const startedAt = Date.now();

      for (const s of steps) {
        if (s.action_type === "wait") {
          const minutes = Number(s.config?.minutes ?? 0);
          if (minutes > 0) {
            await step.sleep(`wait-${workflow.id}-${s.id}`, `${minutes}m`);
          }
          continue;
        }

        try {
          await step.run(`step-${workflow.id}-${s.id}`, () => executeStep(s, lead));
        } catch (err) {
          failed = true;
          errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
          break;
        }
      }

      await step.run(`log-execution-${workflow.id}`, async () => {
        const admin = createAdminClient();
        await admin.from("workflow_executions").insert({
          workflow_id: workflow.id,
          triggered_by_lead_id: lead.leadId,
          status: failed ? "failed" : "success",
          duration_ms: Date.now() - startedAt,
          error_message: errorMessage,
        });
      });
    }

    return { workflowsProcessed: workflows.length };
  }
);

// CinetPay grants a plan for a fixed period per payment rather than an
// auto-renewing subscription (see app/api/webhooks/cinetpay/route.ts) — this
// daily cron closes that loop: downgrade orgs whose period has lapsed, and
// remind admins of orgs expiring soon so they can pay again before that
// happens.
const REMINDER_WINDOW_DAYS = 3;

export const checkCinetpayExpirations = inngest.createFunction(
  { id: "check-cinetpay-expirations", triggers: { cron: "0 8 * * *" } },
  async ({ step }) => {
    const downgraded = await step.run("downgrade-expired", async () => {
      const admin = createAdminClient();
      const { data: expired } = await admin
        .from("organizations")
        .select("id")
        .eq("payment_provider", "cinetpay")
        .lt("plan_expires_at", new Date().toISOString());

      for (const org of expired ?? []) {
        await admin
          .from("organizations")
          .update({ plan: "free", seats_limit: 1, plan_expires_at: null })
          .eq("id", org.id);
      }
      return expired?.length ?? 0;
    });

    const reminded = await step.run("notify-expiring-soon", async () => {
      const admin = createAdminClient();
      const windowEnd = new Date(
        Date.now() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: expiringSoon } = await admin
        .from("organizations")
        .select("id, name, plan")
        .eq("payment_provider", "cinetpay")
        .gte("plan_expires_at", new Date().toISOString())
        .lt("plan_expires_at", windowEnd);

      let count = 0;
      for (const org of expiringSoon ?? []) {
        const { data: admins } = await admin
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", org.id)
          .eq("status", "active")
          .in("role", ["org_admin", "team_admin"]);

        for (const member of admins ?? []) {
          await admin.from("notifications").insert({
            user_id: member.user_id,
            type: "reminder_due",
            payload: {
              message: `Ton abonnement ${org.plan === "business" ? "Business" : "Pro"} expire bientôt — renouvelle-le via Mobile Money pour ne pas repasser en Free.`,
            },
          });
          count += 1;
        }
      }
      return count;
    });

    return { downgraded, reminded };
  }
);
