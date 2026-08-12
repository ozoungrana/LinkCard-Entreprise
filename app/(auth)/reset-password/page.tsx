"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-display text-xl font-semibold">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">Choisis un nouveau mot de passe.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form action={formAction} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="rp-password">Nouveau mot de passe</FieldLabel>
              <Input
                id="rp-password"
                name="password"
                type="password"
                placeholder="8 caractères minimum"
                minLength={8}
                required
              />
              <FieldDescription>Utilise au moins 8 caractères.</FieldDescription>
            </Field>
            {state?.error && <FieldError>{state.error}</FieldError>}
            <Button type="submit" className="justify-center" disabled={pending}>
              {pending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
