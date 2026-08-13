import { History, Lock, Mail, Webhook, Workflow as WorkflowIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateWorkflowDialog } from "@/components/features/create-workflow-dialog";
import { EmailTemplatesManager } from "@/components/features/email-templates-manager";
import { WebhooksManager } from "@/components/features/webhooks-manager";
import { WorkflowToggle } from "@/components/features/workflow-toggle";
import {
  getCurrentOrganization,
  getEmailTemplates,
  getMyWorkflows,
  getWebhooks,
} from "@/lib/supabase/queries";

export default async function AutomationsPage() {
  const organization = await getCurrentOrganization();

  // Chapter 10 §2 — automations aren't part of the Free plan at all.
  if (organization?.plan === "free") {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
        <CardContent className="flex flex-col items-center gap-2">
          <Lock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Les automatisations ne sont pas disponibles sur le plan Free.
          </p>
          <p className="text-xs text-muted-foreground">
            Passe à Pro pour créer ton premier workflow.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [workflows, emailTemplates, webhooks] = await Promise.all([
    getMyWorkflows(),
    getEmailTemplates(),
    getWebhooks(),
  ]);

  return (
    <Tabs
      defaultValue="wf-list"
      orientation="vertical"
      className="items-start gap-4 lg:grid lg:grid-cols-[240px_1fr]"
    >
      <Card className="w-full gap-0 p-2">
        <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
          <TabsTrigger value="wf-list" className="w-full justify-start px-3 py-2">
            <WorkflowIcon />
            Mes workflows
          </TabsTrigger>
          <TabsTrigger value="wf-emails" className="w-full justify-start px-3 py-2">
            <Mail />
            Modèles email
          </TabsTrigger>
          <TabsTrigger value="wf-webhooks" className="w-full justify-start px-3 py-2">
            <Webhook />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="wf-history" className="w-full justify-start px-3 py-2">
            <History />
            Historique des exécutions
          </TabsTrigger>
        </TabsList>
      </Card>

      <Card className="w-full p-6">
        <TabsContent value="wf-list" className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold">Workflows actifs</h3>
            <p className="text-xs text-muted-foreground">
              Automatise ce qui se passe après chaque événement — un lead capturé, une carte
              publiée, un contact synchronisé.
              {organization?.plan === "pro" && " Le plan Pro permet 1 workflow actif à la fois."}
            </p>
          </div>

          {workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun workflow pour l&apos;instant.</p>
          ) : (
            workflows.map((wf) => (
              <div key={wf.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <WorkflowIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{wf.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Déclencheur : {wf.trigger_type}
                  </div>
                </div>
                <WorkflowToggle id={wf.id} isActive={wf.is_active} />
              </div>
            ))
          )}

          <CreateWorkflowDialog />
        </TabsContent>

        <TabsContent value="wf-emails">
          <EmailTemplatesManager templates={emailTemplates} />
        </TabsContent>

        <TabsContent value="wf-webhooks">
          <WebhooksManager webhooks={webhooks} />
        </TabsContent>

        <TabsContent value="wf-history">
          <p className="text-sm text-muted-foreground">
            L&apos;historique d&apos;exécution arrive avec le moteur de workflow (Inngest ou
            Trigger.dev — pas encore choisi).
          </p>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
