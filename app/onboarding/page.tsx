import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/features/onboarding-wizard";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // No "already has a card" redirect here: Next.js re-renders this Server
  // Component after every Server Action the wizard fires (including the one
  // that creates the card in step 1), which would immediately bounce the
  // user to /dashboard mid-wizard. The Free-plan 1-card cap in
  // createProfileForOnboarding already stops someone from abusing this by
  // revisiting the URL.
  return <OnboardingWizard userName={user.name ?? ""} />;
}
