"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Clock, Globe, Mail, Plug, Plus, Trash2, type LucideIcon } from "lucide-react";

import { addWorkflowStep, deleteWorkflowStep } from "@/lib/actions/workflow-steps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowActionType, WorkflowStep } from "@/lib/supabase/types";

const ACTION_LABELS: Record<WorkflowActionType, string> = {
  webhook_call: "Appeler un webhook",
  notify_slack: "Notifier Slack",
  notify_teams: "Notifier Teams",
  wait: "Attendre",
  send_email: "Envoyer un email (modèle)",
  create_crm_contact: "Créer un contact CRM",
};

const ACTION_ICONS: Record<WorkflowActionType, LucideIcon> = {
  webhook_call: Globe,
  notify_slack: Bell,
  notify_teams: Bell,
  wait: Clock,
  send_email: Mail,
  create_crm_contact: Plug,
};

function describeStep(step: WorkflowStep): string {
  switch (step.action_type) {
    case "webhook_call":
      return String(step.config.url ?? "");
    case "notify_slack":
    case "notify_teams":
      return String(step.config.webhookUrl ?? "");
    case "wait":
      return `${step.config.minutes ?? 0} min`;
    case "send_email":
      return "nécessite un fournisseur email (non configuré)";
    case "create_crm_contact":
      return "nécessite une connexion CRM (non configurée)";
    default:
      return "";
  }
}

export function WorkflowStepsSection({
  workflowId,
  steps,
}: {
  workflowId: string;
  steps: WorkflowStep[];
}) {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<WorkflowActionType>("webhook_call");
  const [url, setUrl] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  function reset() {
    setActionType("webhook_call");
    setUrl("");
    setMinutes(5);
  }

  function submit() {
    let config: Record<string, unknown> = {};
    if (actionType === "webhook_call") config = { url: url.trim() };
    else if (actionType === "notify_slack" || actionType === "notify_teams") {
      config = { webhookUrl: url.trim() };
    } else if (actionType === "wait") config = { minutes };

    startTransition(async () => {
      const result = await addWorkflowStep(workflowId, actionType, config);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Étape ajoutée");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteWorkflowStep(id);
      if (result?.error) toast.error(result.error);
      else router.refresh();
      setBusyId(null);
    });
  }

  const needsUrl = actionType === "webhook_call" || actionType === "notify_slack" || actionType === "notify_teams";
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

  return (
    <div className="ml-12 flex flex-col gap-1.5 border-l pl-3">
      {sortedSteps.map((s, i) => {
        const Icon = ACTION_ICONS[s.action_type];
        return (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{i + 1}.</span>
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="shrink-0 font-medium">{ACTION_LABELS[s.action_type]}</span>
            <span className="truncate text-muted-foreground">{describeStep(s)}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto size-6 shrink-0"
              disabled={busyId === s.id}
              onClick={() => remove(s.id)}
            >
              <Trash2 className="size-3 text-danger" />
            </Button>
          </div>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-fit text-xs">
            <Plus className="size-3" />
            Ajouter une étape
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une étape</DialogTitle>
            <DialogDescription>
              Exécutée dans l&apos;ordre à chaque déclenchement de ce workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="step-type">Action</FieldLabel>
              <Select value={actionType} onValueChange={(v) => setActionType(v as WorkflowActionType)}>
                <SelectTrigger id="step-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTION_LABELS) as WorkflowActionType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {ACTION_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {needsUrl && (
              <Field>
                <FieldLabel htmlFor="step-url">
                  {actionType === "webhook_call" ? "URL du webhook" : "URL du webhook entrant"}
                </FieldLabel>
                <Input
                  id="step-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
            )}

            {actionType === "wait" && (
              <Field>
                <FieldLabel htmlFor="step-minutes">Durée (minutes)</FieldLabel>
                <Input
                  id="step-minutes"
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
            )}

            {(actionType === "send_email" || actionType === "create_crm_contact") && (
              <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Cette étape sera ajoutée mais échouera à l&apos;exécution tant qu&apos;
                {actionType === "send_email" ? "un fournisseur email" : "une connexion CRM"} n&apos;est
                pas configuré(e).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button disabled={pending || (needsUrl && !url.trim())} onClick={submit}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
