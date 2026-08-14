"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createEmailTemplate,
  deleteEmailTemplate,
  updateEmailTemplate,
} from "@/lib/actions/email-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

function TemplateFormDialog({
  template,
  trigger,
}: {
  template?: EmailTemplate;
  trigger: React.ReactNode;
}) {
  const isEdit = !!template;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName(template?.name ?? "");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
  }

  function submit() {
    startTransition(async () => {
      const result = isEdit
        ? await updateEmailTemplate(template.id, name, subject, body)
        : await createEmailTemplate(name, subject, body);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Modèle mis à jour" : "Modèle créé");
      setOpen(false);
      if (!isEdit) reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le modèle" : "Nouveau modèle d'email"}</DialogTitle>
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
            <Textarea id="tpl-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          </Field>
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim() || !subject.trim() || !body.trim() || pending}
            onClick={submit}
          >
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTemplateButton({ template }: { template: EmailTemplate }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await deleteEmailTemplate(template.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Modèle supprimé");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Supprimer le modèle">
          <Trash2 className="text-danger" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {template.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" disabled={pending} onClick={submit}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EmailTemplatesManager({ templates }: { templates: EmailTemplate[] }) {
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
        <TemplateFormDialog
          trigger={
            <Button size="sm">
              <Plus />
              Nouveau modèle
            </Button>
          }
        />
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
              <TemplateFormDialog
                template={tpl}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Modifier le modèle">
                    <Pencil />
                  </Button>
                }
              />
              <DeleteTemplateButton template={tpl} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
