"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";

export async function updateOrganizationBranding(values: {
  brand_primary_color: string;
  brand_secondary_color: string;
  layout_locked: boolean;
}) {
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("Aucune organisation associée à ce compte.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(values)
    .eq("id", organization.id);
  // RLS (org_admins_can_update_their_org) silently returns 0 rows if the
  // caller isn't an org_admin/team_admin rather than raising — surface that.
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
