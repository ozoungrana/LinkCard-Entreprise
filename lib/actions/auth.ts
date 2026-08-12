"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;
export type AuthMessageState = { error?: string; success?: string } | undefined;

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const terms = formData.get("terms");

  if (!terms) {
    return { error: "Merci d'accepter les conditions d'utilisation." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?registered=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prevState: AuthMessageState,
  formData: FormData
): Promise<AuthMessageState> {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Always report success, even if the email doesn't exist — otherwise this
  // becomes an account-enumeration oracle.
  if (error) {
    return { success: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
  }
  return { success: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function sendMagicLink(
  _prevState: AuthMessageState,
  formData: FormData
): Promise<AuthMessageState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { error: "Renseigne ton email d'abord." };

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/dashboard` },
  });

  if (error) return { error: error.message };
  return { success: "Lien de connexion envoyé — vérifie ta boîte mail." };
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Lien expiré. Redemande une réinitialisation." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
