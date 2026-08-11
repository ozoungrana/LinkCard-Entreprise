"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { submitReciprocalLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MESSAGE_MAX = 500;

export function ReciprocalForm({
  profileId,
  recipientName,
}: {
  profileId: string;
  recipientName: string;
}) {
  const boundAction = submitReciprocalLead.bind(null, profileId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <h4 className="font-medium">Merci !</h4>
        <p className="text-sm text-muted-foreground">
          Tes coordonnées ont bien été transmises à {recipientName}. Tu recevras une confirmation
          par email.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="rf-name">Votre nom</FieldLabel>
          <Input id="rf-name" name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="rf-email">Votre email</FieldLabel>
          <Input id="rf-email" name="email" type="email" required />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="rf-phone">Téléphone (optionnel)</FieldLabel>
        <Input id="rf-phone" name="phone" type="tel" />
      </Field>
      <Field>
        <FieldLabel htmlFor="rf-message">Message (optionnel)</FieldLabel>
        <textarea
          id="rf-message"
          name="message"
          maxLength={MESSAGE_MAX}
          className="min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>

      <div className="flex items-start gap-2">
        <Checkbox id="rf-consent" name="consent" required />
        <label htmlFor="rf-consent" className="text-xs text-muted-foreground">
          J&apos;accepte que mes coordonnées soient transmises à {recipientName}, conformément à
          la politique de confidentialité.
        </label>
      </div>

      {state?.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={pending} className="justify-center">
        {pending ? "Envoi…" : "Envoyer mes informations"}
      </Button>
    </form>
  );
}
