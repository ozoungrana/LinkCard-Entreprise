"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";

function slugify(input: string) {
  // NFD-normalizing first decomposes accented letters into base + combining
  // mark; the mark then falls out along with any other non-alphanumeric run.
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "carte"
  );
}

export async function createProfile(name: string, type: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("Aucune organisation associée à ce compte.");

  // Chapter 10 §2 — Free is capped at 1 active card.
  if (organization.plan === "free") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null);
    if ((count ?? 0) >= 1) {
      throw new Error(
        "Le plan Free est limité à 1 carte active. Passe à Pro pour créer des cartes illimitées."
      );
    }
  }

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      organization_id: organization.id,
      owner_id: user.id,
      full_name: name,
      type,
      slug,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer la carte.");
  }

  revalidatePath("/cards");
  redirect(`/editor/${data.id}`);
}

export type ProfileFormValues = {
  full_name: string;
  job_title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  website_url: string;
  linkedin_url: string;
  calendly_url: string;
  portfolio_url: string;
  brand_primary_color: string;
  font: string;
  template: string;
};

export async function updateProfile(profileId: string, values: ProfileFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data: before } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("owner_id", user.id)
    .single();
  if (!before) throw new Error("Carte introuvable.");

  const { error } = await supabase
    .from("profiles")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);

  await supabase.from("profile_versions").insert({
    profile_id: profileId,
    snapshot: { ...before, ...values },
    change_summary: "Mise à jour depuis l'éditeur",
    created_by: user.id,
  });

  revalidatePath(`/editor/${profileId}`);
  revalidatePath("/cards");
  revalidatePath("/dashboard");

  return { success: true } as const;
}

export async function deleteProfile(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Soft delete — profiles has a 30-day trash per chapter 9 §1.4 / ch.8.
  await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", profileId)
    .eq("owner_id", user.id);

  revalidatePath("/cards");
  redirect("/cards");
}

export async function setProfileStatus(
  profileId: string,
  status: "draft" | "published" | "archived"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  await supabase.from("profiles").update({ status }).eq("id", profileId).eq("owner_id", user.id);

  revalidatePath(`/editor/${profileId}`);
  revalidatePath("/cards");
}
