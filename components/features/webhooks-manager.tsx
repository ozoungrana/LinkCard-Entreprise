"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Webhook as WebhookIcon, Zap } from "lucide-react";

import { createWebhook, deleteWebhook, testWebhook, toggleWebhook } from "@/lib/actions/webhooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { WEBHOOK_EVENTS, type Webhook, type WebhookEvent } from "@/lib/supabase/types";

const EVENT_LABELS: Record<WebhookEvent, string> = {
  lead_captured: "Lead capturé",
  card_published: "Carte publiée",
  contact_synced: "Contact synchronisé",
};

export function WebhooksManager({ webhooks }: { webhooks: Webhook[] }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  function toggleEvent(event: WebhookEvent) {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  }

  function submit() {
    startTransition(async () => {
      const result = await createWebhook(url.trim(), events);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Webhook ajouté");
      setOpen(false);
      setUrl("");
      setEvents([]);
      router.refresh();
    });
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteWebhook(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Webhook supprimé");
        router.refresh();
      }
      setBusyId(null);
    });
  }

  function toggle(id: string, isActive: boolean) {
    setBusyId(id);
    startTransition(async () => {
      const result = await toggleWebhook(id, isActive);
      if (result?.error) toast.error(result.error);
      else router.refresh();
      setBusyId(null);
    });
  }

  function test(id: string, webhookUrl: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await testWebhook(id, webhookUrl);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Webhook répond correctement (code ${result.statusCode})`);
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Webhooks sortants</h3>
          <p className="text-xs text-muted-foreground">
            Reçois une notification HTTP POST sur ton propre serveur à chaque événement choisi.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Ajouter un webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau webhook</DialogTitle>
              <DialogDescription>L&apos;URL doit être une adresse https://.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="wh-url">URL</FieldLabel>
                <Input
                  id="wh-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemple.com/webhooks/linkcard"
                />
              </Field>
              <Field>
                <FieldLabel>Événements</FieldLabel>
                <div className="flex flex-col gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={events.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      {EVENT_LABELS[event]}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <DialogFooter>
              <Button disabled={!url.trim() || events.length === 0 || pending} onClick={submit}>
                {pending ? "Ajout…" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun webhook pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <WebhookIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{wh.url}</div>
                <div className="text-xs text-muted-foreground">
                  {wh.events.map((e) => EVENT_LABELS[e as WebhookEvent] ?? e).join(", ")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === wh.id}
                onClick={() => test(wh.id, wh.url)}
              >
                <Zap />
                Tester
              </Button>
              <Switch
                checked={wh.is_active}
                disabled={busyId === wh.id}
                onCheckedChange={(checked) => toggle(wh.id, checked)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busyId === wh.id}
                onClick={() => remove(wh.id)}
              >
                <Trash2 className="text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
