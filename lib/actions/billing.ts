"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import { getStripe } from "@/lib/stripe/client";
import { siteOrigin } from "@/lib/site-url";

// Chapter 10 §6 — Business requires a minimum of 3 seats billed upfront.
const MIN_BUSINESS_SEATS = 3;

export type BillingActionResult = { error: string } | undefined;

// Server Actions have their thrown-error messages redacted in production
// builds (Next.js strips them to a generic digest for security), so
// business-facing errors here are returned, not thrown — redirect() is the
// only exception, since it's Next's own control-flow throw and isn't
// affected by that redaction.

function priceIdFor(plan: "pro" | "business") {
  return plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS;
}

export async function createCheckoutSession(
  plan: "pro" | "business",
  seats?: number
): Promise<BillingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organization = await getCurrentOrganization();
  if (!organization) return { error: "Aucune organisation associée à ce compte." };

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return {
      error: `Le plan ${plan === "pro" ? "Pro" : "Business"} n'est pas encore configuré côté Stripe (price ID manquant).`,
    };
  }

  let sessionUrl: string;
  try {
    const stripe = getStripe();
    const origin = await siteOrigin();
    const quantity = plan === "business" ? Math.max(MIN_BUSINESS_SEATS, seats ?? MIN_BUSINESS_SEATS) : 1;

    let customerId = organization.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { organization_id: organization.id },
      });
      customerId = customer.id;
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", organization.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity }],
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancelled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { organization_id: organization.id, plan },
      },
      // Chapter 10 §6 — Pro's trial never requires a card up front; Business does.
      payment_method_collection: plan === "pro" ? "if_required" : "always",
      allow_promotion_codes: true,
      client_reference_id: organization.id,
      metadata: { organization_id: organization.id, plan },
    });

    if (!session.url) return { error: "Impossible de créer la session de paiement." };
    sessionUrl = session.url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur Stripe inattendue." };
  }

  redirect(sessionUrl);
}

export async function createBillingPortalSession(): Promise<BillingActionResult> {
  const organization = await getCurrentOrganization();
  if (!organization?.stripe_customer_id) {
    return { error: "Aucun abonnement actif à gérer pour le moment." };
  }

  let sessionUrl: string;
  try {
    const stripe = getStripe();
    const origin = await siteOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    sessionUrl = session.url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur Stripe inattendue." };
  }

  redirect(sessionUrl);
}
