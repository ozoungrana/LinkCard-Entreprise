"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-display text-xl font-semibold">Crée ton compte</h1>
          <p className="text-sm text-muted-foreground">
            3 minutes suffisent pour publier ta première carte
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Button variant="outline">Continuer avec Google</Button>

          <div className="relative text-center text-xs text-muted-foreground">
            <Separator className="absolute top-1/2" />
            <span className="relative bg-card px-2">ou avec ton email</span>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="re-name">Nom complet</FieldLabel>
              <Input id="re-name" name="name" placeholder="Ton nom" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="re-email">Email professionnel</FieldLabel>
              <Input id="re-email" name="email" type="email" placeholder="toi@entreprise.com" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="re-password">Mot de passe</FieldLabel>
              <Input
                id="re-password"
                name="password"
                type="password"
                placeholder="8 caractères minimum"
                minLength={8}
                required
              />
              <FieldDescription>
                Utilise au moins 8 caractères, avec une majuscule et un chiffre
              </FieldDescription>
            </Field>

            <div className="flex items-start gap-2">
              <Checkbox
                id="re-terms"
                name="terms"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
              />
              <label htmlFor="re-terms" className="text-xs text-muted-foreground">
                J&apos;accepte les Conditions d&apos;utilisation et la Politique de
                confidentialité de LinkCard.
              </label>
            </div>

            {state?.error && <FieldError>{state.error}</FieldError>}

            <Button type="submit" className="justify-center" disabled={!termsAccepted || pending}>
              {pending ? "Création…" : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
