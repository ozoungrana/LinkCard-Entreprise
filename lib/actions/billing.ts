"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries";
import { getStripe } from "@/lib/stripe/client";
import { siteOrigin } from "@/lib/site-url";

// Chapter 10 §6 — Business requires a minimum of 3 seats billed upfront.
const MIN_BUSINESS_SEATS = 3;

function priceIdFor(plan: "pro" | "business") {
  const priceId =
    plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS;
  if (!priceId) {
    throw new Error(
      `Le plan ${plan === "pro" ? "Pro" : "Business"} n'est pas encore configuré côté Stripe (price ID manquant).`
    );
  }
  return priceId;
}

export async function createCheckoutSession(plan: "pro" | "business", seats?: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("Aucune organisation associée à ce compte.");

  const stripe = getStripe();
  const origin = await siteOrigin();
  const priceId = priceIdFor(plan);
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

  if (!session.url) throw new Error("Impossible de créer la session de paiement.");
  redirect(session.url);
}

export async function createBillingPortalSession() {
  const organization = await getCurrentOrganization();
  if (!organization?.stripe_customer_id) {
    throw new Error("Aucun abonnement actif à gérer pour le moment.");
  }

  const stripe = getStripe();
  const origin = await siteOrigin();

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: `${origin}/account`,
  });

  redirect(session.url);
}
