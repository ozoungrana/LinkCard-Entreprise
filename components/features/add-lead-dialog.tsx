"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { createLeadManually } from "@/lib/actions/leads";
import { queuePendingLead } from "@/lib/offline-lead-queue";
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

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  function submit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const payload = {
      name: trimmedName,
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    };

    startTransition(async () => {
      if (!navigator.onLine) {
        await queuePendingLead(payload);
        toast.success("Contact enregistré hors-ligne — sera synchronisé au retour du réseau.");
        setOpen(false);
        reset();
        return;
      }

      try {
        const result = await createLeadManually(payload);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Contact ajouté");
        setOpen(false);
        reset();
        router.refresh();
      } catch {
        // Network dropped mid-request even though navigator.onLine said
        // otherwise — don't lose the data, queue it like a real offline case.
        await queuePendingLead(payload);
        toast.success("Contact enregistré hors-ligne — sera synchronisé au retour du réseau.");
        setOpen(false);
        reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus />
          Ajouter un contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un contact</DialogTitle>
          <DialogDescription>
            Pour un contact rencontré sur le terrain. Fonctionne même sans connexion — la fiche
            sera synchronisée automatiquement au retour du réseau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="lead-name">Nom complet</FieldLabel>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-company">Entreprise</FieldLabel>
            <Input id="lead-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-email">Email</FieldLabel>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-phone">Téléphone</FieldLabel>
            <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
            <Textarea
              id="lead-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button disabled={!name.trim() || pending} onClick={submit}>
            {pending ? "Enregistrement…" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
