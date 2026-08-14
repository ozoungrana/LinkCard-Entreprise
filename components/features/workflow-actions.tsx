"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { deleteWorkflow, renameWorkflow } from "@/lib/actions/workflows";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function WorkflowActions({
  workflowId,
  workflowName,
}: {
  workflowId: string;
  workflowName: string;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(workflowName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submitRename() {
    startTransition(async () => {
      const result = await renameWorkflow(workflowId, name);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Workflow renommé");
      setRenameOpen(false);
      router.refresh();
    });
  }

  function submitDelete() {
    startTransition(async () => {
      const result = await deleteWorkflow(workflowId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Workflow supprimé");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog
        open={renameOpen}
        onOpenChange={(next) => {
          setRenameOpen(next);
          if (next) setName(workflowName);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Renommer le workflow">
            <Pencil />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer le workflow</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="wf-rename">Nom du workflow</FieldLabel>
            <Input id="wf-rename" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button disabled={!name.trim() || pending} onClick={submitRename}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Supprimer le workflow">
            <Trash2 className="text-danger" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {workflowName} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Les étapes et l&apos;historique d&apos;exécution de ce
              workflow seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" disabled={pending} onClick={submitDelete}>
                {pending ? "Suppression…" : "Supprimer définitivement"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
