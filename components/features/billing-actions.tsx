"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

import { createBillingPortalSession, createCheckoutSession } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function UpgradePlanDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(3);
  const [pending, startTransition] = useTransition();

  function upgrade(plan: "pro" | "business") {
    startTransition(async () => {
      const result = await createCheckoutSession(plan, plan === "business" ? seats : undefined);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline">Changer de plan</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choisis ton plan</DialogTitle>
          <DialogDescription>
            Essai gratuit de 14 jours. Annule à tout moment depuis le portail de facturation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="font-display font-semibold">Pro</div>
              <div className="text-sm text-muted-foreground">9 €/mois · cartes illimitées</div>
            </div>
            <Button disabled={pending} onClick={() => upgrade("pro")}>
              {pending ? "…" : "Choisir Pro"}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display font-semibold">Business</div>
                <div className="text-sm text-muted-foreground">19 €/utilisateur/mois · min. 3 sièges</div>
              </div>
              <Button disabled={pending} onClick={() => upgrade("business")}>
                {pending ? "…" : "Choisir Business"}
              </Button>
            </div>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="seats" className="text-xs">
                Nombre de sièges
              </FieldLabel>
              <Input
                id="seats"
                type="number"
                min={3}
                value={seats}
                onChange={(e) => setSeats(Math.max(3, Number(e.target.value) || 3))}
                className="w-20"
              />
            </Field>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  function manage() {
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={manage}>
      <CreditCard />
      {pending ? "Ouverture…" : "Gérer mon abonnement et mes factures"}
    </Button>
  );
}
