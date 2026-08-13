"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createWorkflow } from "@/lib/actions/workflows";
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

export function CreateWorkflowDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate() {
    startTransition(async () => {
      const result = await createWorkflow(name.trim());
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      setName("");
      router.refresh();
      toast.success("Workflow créé");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nouveau workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau workflow</DialogTitle>
          <DialogDescription>
            Donne-lui un nom. Le déclencheur et les actions seront configurables prochainement.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="wf-new-name">Nom du workflow</FieldLabel>
          <Input id="wf-new-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button disabled={!name.trim() || pending} onClick={handleCreate}>
            {pending ? "Création…" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
