import { NextResponse, type NextRequest } from "next/server";
import { checkCinetpayTransaction } from "@/lib/cinetpay/client";
import { createAdminClient } from "@/lib/supabase/admin";

// CinetPay grants access for a fixed period per successful payment (no
// native recurring subscription) — the Inngest cron in
// lib/inngest/functions.ts downgrades organizations past plan_expires_at.
const PLAN_DURATION_DAYS = 30;

// CinetPay always expects a 200 response from notify_url, or it will retry
// indefinitely — so every branch below returns 200 even on internal lookup
// failures; only the transaction row's own status reflects what happened.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const transactionId = form.get("cpm_trans_id")?.toString();
  if (!transactionId) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const { data: txRow } = await admin
    .from("cinetpay_transactions")
    .select("*")
    .eq("transaction_id", transactionId)
    .single();
  if (!txRow) return NextResponse.json({ received: true });

  // Never trust the notify payload directly — always re-verify the
  // transaction status server-to-server against CinetPay's own API before
  // granting anything.
  const check = await checkCinetpayTransaction(transactionId);
  if ("error" in check) return NextResponse.json({ received: true });

  if (check.status === "ACCEPTED") {
    if (Number(check.amount) !== Number(txRow.amount) || check.currency !== txRow.currency) {
      await admin
        .from("cinetpay_transactions")
        .update({ status: "refused", updated_at: new Date().toISOString() })
        .eq("transaction_id", transactionId);
      return NextResponse.json({ received: true });
    }

    await admin
      .from("cinetpay_transactions")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("transaction_id", transactionId);

    const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await admin.rpc("apply_cinetpay_plan", {
      p_organization_id: txRow.organization_id,
      p_plan: txRow.plan,
      p_seats_limit: txRow.plan === "business" ? txRow.seats : 1,
      p_expires_at: expiresAt,
    });
  } else if (check.status === "REFUSED" || check.status === "CANCELLED") {
    await admin
      .from("cinetpay_transactions")
      .update({ status: check.status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq("transaction_id", transactionId);
  }

  return NextResponse.json({ received: true });
}
