import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_BUSINESS_SEATS = 3;

function planFromPriceId(priceId: string | undefined): "pro" | "business" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return null;
}

async function syncFromSubscription(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id;
  if (!organizationId) return;

  const admin = createAdminClient();
  const item = subscription.items.data[0];
  const plan = planFromPriceId(item?.price.id) ?? (subscription.metadata.plan as "pro" | "business" | undefined);

  if (!plan) return;

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const seatsLimit = plan === "business" ? Math.max(MIN_BUSINESS_SEATS, item?.quantity ?? MIN_BUSINESS_SEATS) : 1;

  await admin.rpc("sync_organization_plan", {
    p_organization_id: organizationId,
    p_plan: isActive ? plan : "free",
    p_seats_limit: isActive ? seatsLimit : 1,
    p_stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const organizationId = session.client_reference_id;
      const plan = session.metadata?.plan as "pro" | "business" | undefined;
      if (organizationId && plan && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncFromSubscription(subscription);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncFromSubscription(event.data.object);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
