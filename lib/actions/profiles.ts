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

type CreateProfileResult = { id: string; slug: string } | { error: string };

// Server Actions have their thrown-error messages redacted in production
// builds (Next.js strips them to a generic digest for security), so
// business-facing errors here are returned, not thrown — redirect() is the
// only exception, since it's Next's own control-flow throw and isn't
// affected by that redaction.
async function createProfileRow(name: string, type: string): Promise<CreateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  // Chapter 10 §2 — Free is capped at 1 active card.
  if (organization.plan === "free") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null);
    if ((count ?? 0) >= 1) {
      return {
        error: "Le plan Free est limité à 1 carte active. Passe à Pro pour créer des cartes illimitées.",
      };
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
    .select("id, slug")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la carte." };
  }

  revalidatePath("/cards");
  return data as { id: string; slug: string };
}

export async function createProfile(name: string, type: string): Promise<{ error: string } | undefined> {
  const result = await createProfileRow(name, type);
  if ("error" in result) return result;
  redirect(`/editor/${result.id}`);
}

// Used by the onboarding wizard, which drives its own step navigation
// instead of jumping straight to the full editor.
export async function createProfileForOnboarding(name: string, type: string) {
  return createProfileRow(name, type);
}

export type ProfileFormValues = {
  full_name: string;
  job_title: string;
  company: string;
  phone: string;
  whatsapp_number: string;
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

export async function updateProfile(
  profileId: string,
  values: ProfileFormValues,
  changeSummary = "Mise à jour depuis l'éditeur"
) {
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
    change_summary: changeSummary,
    created_by: user.id,
  });

  revalidatePath(`/editor/${profileId}`);
  revalidatePath("/cards");
  revalidatePath("/dashboard");

  return { success: true } as const;
}

const PROFILE_FORM_KEYS = [
  "full_name",
  "job_title",
  "company",
  "phone",
  "whatsapp_number",
  "email",
  "address",
  "website_url",
  "linkedin_url",
  "calendly_url",
  "portfolio_url",
  "brand_primary_color",
  "font",
  "template",
] as const;

export async function restoreProfileVersion(profileId: string, versionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data: version } = await supabase
    .from("profile_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("profile_id", profileId)
    .single();
  if (!version) throw new Error("Version introuvable.");

  const snapshot = version.snapshot as Record<string, unknown>;
  const values = Object.fromEntries(
    PROFILE_FORM_KEYS.map((key) => [key, (snapshot[key] as string) ?? ""])
  ) as ProfileFormValues;

  return updateProfile(profileId, values, "Restauré depuis une version précédente");
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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(profileId: string, file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error("Format non supporté. Utilise une image JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("L'image dépasse 5 Mo. Choisis un fichier plus léger.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("owner_id", user.id)
    .single();
  if (!profile) throw new Error("Carte introuvable.");

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${profileId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new photo shows immediately even though the path is stable.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/editor/${profileId}`);
  revalidatePath("/cards");
  revalidatePath("/dashboard");

  return { avatarUrl } as const;
}
