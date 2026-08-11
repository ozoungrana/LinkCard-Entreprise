"use client";

import { useActionState } from "react";
import Link from "next/link";

import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-display text-xl font-semibold">Content de te revoir</h1>
          <p className="text-sm text-muted-foreground">Connecte-toi à ton espace LinkCard</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Button variant="outline">Continuer avec Google</Button>
            <Button variant="outline">Continuer avec Microsoft</Button>
            <Button variant="outline">Continuer avec Apple</Button>
          </div>

          <div className="relative text-center text-xs text-muted-foreground">
            <Separator className="absolute top-1/2" />
            <span className="relative bg-card px-2">ou avec ton email</span>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="li-email">Email</FieldLabel>
              <Input
                id="li-email"
                name="email"
                type="email"
                placeholder="toi@entreprise.com"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="li-password">Mot de passe</FieldLabel>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input id="li-password" name="password" type="password" placeholder="••••••••" required />
            </Field>
            {state?.error && <FieldError>{state.error}</FieldError>}
            <Button type="submit" className="justify-center" disabled={pending}>
              {pending ? "Connexion…" : "Se connecter"}
            </Button>
            <Button type="button" variant="ghost" className="justify-center">
              Recevoir un lien magique
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-primary hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
