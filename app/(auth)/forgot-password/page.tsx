"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordReset } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-display text-xl font-semibold">Mot de passe oublié ?</h1>
          <p className="text-sm text-muted-foreground">
            Indique ton email, on t&apos;envoie un lien pour le réinitialiser.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {state?.success ? (
            <p className="text-center text-sm text-success">{state.success}</p>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="fp-email">Email</FieldLabel>
                <Input
                  id="fp-email"
                  name="email"
                  type="email"
                  placeholder="toi@entreprise.com"
                  required
                />
              </Field>
              {state?.error && <FieldError>{state.error}</FieldError>}
              <Button type="submit" className="justify-center" disabled={pending}>
                {pending ? "Envoi…" : "Envoyer le lien"}
              </Button>
            </form>
          )}

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
