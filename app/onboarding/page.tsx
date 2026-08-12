import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/features/onboarding-wizard";
import { getCurrentUser, getMyProfiles } from "@/lib/supabase/queries";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Already has a card — onboarding is a one-time first-card setup, not a
  // recurring entry point.
  const existing = await getMyProfiles();
  if (existing.length > 0) redirect("/dashboard");

  return <OnboardingWizard userName={user.name ?? ""} />;
}
