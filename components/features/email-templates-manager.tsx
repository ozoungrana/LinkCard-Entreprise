"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Plus, Trash2 } from "lucide-react";

import { createEmailTemplate, deleteEmailTemplate } from "@/lib/actions/email-templates";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import type { EmailTemplate } from "@/lib/supabase/types";

export function EmailTemplatesManager({ templates }: { templates: EmailTemplate[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  function reset() {
    setName("");
    setSubject("");
    setBody("");
  }

  function submit() {
    startTransition(async () => {
      const result = await createEmailTemplate(name, subject, body);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Modèle créé");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteEmailTemplate(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Modèle supprimé");
        router.refresh();
      }
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Modèles d&apos;email</h3>
          <p className="text-xs text-muted-foreground">
            Utilise <code className="font-mono text-[11px]">{"{{variable}}"}</code> dans le
            contenu pour insérer des données dynamiques.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau modèle d&apos;email</DialogTitle>
              <DialogDescription>
                Les variables entre doubles accolades (ex. {"{{prenom}}"}) sont détectées
                automatiquement dans le contenu.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="tpl-name">Nom</FieldLabel>
                <Input
                  id="tpl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Relance J+3"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tpl-subject">Objet</FieldLabel>
                <Input
                  id="tpl-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ravi de vous avoir rencontré, {{prenom}}"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tpl-body">Contenu</FieldLabel>
                <Textarea
                  id="tpl-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                disabled={!name.trim() || !subject.trim() || !body.trim() || pending}
                onClick={submit}
              >
                {pending ? "Création…" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun modèle pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{tpl.name}</div>
                <div className="truncate text-xs text-muted-foreground">{tpl.subject}</div>
                {tpl.variables.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tpl.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="font-mono text-[10px]">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busyId === tpl.id}
                onClick={() => remove(tpl.id)}
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
