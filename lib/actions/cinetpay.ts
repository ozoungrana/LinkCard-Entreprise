"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import { createCinetpayPayment, isCinetpayConfigured } from "@/lib/cinetpay/client";
import { CINETPAY_PRICING, cinetpayMinSeats } from "@/lib/pricing";
import { siteOrigin } from "@/lib/site-url";

const MIN_BUSINESS_SEATS = cinetpayMinSeats();

export type CinetpayActionResult = { error: string } | undefined;

export async function createCinetpayCheckout(
  plan: "pro" | "business",
  seats?: number
): Promise<CinetpayActionResult> {
  if (!isCinetpayConfigured()) {
    return {
      error: "Le paiement Mobile Money n'est pas encore disponible. Essaie le paiement par carte.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const quantity = plan === "business" ? Math.max(MIN_BUSINESS_SEATS, seats ?? MIN_BUSINESS_SEATS) : 1;
  const pricing = CINETPAY_PRICING[plan];
  const amount = pricing.amount * quantity;
  // Dashes stripped: CinetPay transaction_id is restricted to alphanumerics.
  const transactionId = crypto.randomUUID().replace(/-/g, "");

  const { error: insertError } = await supabase.from("cinetpay_transactions").insert({
    transaction_id: transactionId,
    organization_id: organization.id,
    plan,
    seats: quantity,
    amount,
    currency: "XOF",
  });
  if (insertError) return { error: insertError.message };

  const origin = await siteOrigin();
  const result = await createCinetpayPayment({
    transactionId,
    amount,
    currency: "XOF",
    description: `Abonnement LinkCard ${pricing.label}${plan === "business" ? ` (${quantity} sièges)` : ""}`,
    customerName: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Client LinkCard",
    customerEmail: user.email ?? "",
    notifyUrl: `${origin}/api/webhooks/cinetpay`,
    returnUrl: `${origin}/account?checkout=pending`,
  });

  if ("error" in result) return { error: result.error };

  redirect(result.url);
}
