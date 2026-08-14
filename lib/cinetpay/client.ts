import "server-only";

// CinetPay REST API v2 — mobile money aggregator for West/Central Africa
// (Orange Money, MTN Money, Moov Money, Wave) plus cards. Field names below
// follow CinetPay's published v2 checkout docs as of this writing; verify
// against the current CinetPay dashboard/docs once real sandbox credentials
// are available, since third-party APIs change without notice.
const CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2";

export function isCinetpayConfigured() {
  return Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);
}

export type CreateCinetpayPaymentInput = {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  notifyUrl: string;
  returnUrl: string;
};

export type CreateCinetpayPaymentResult = { url: string } | { error: string };

export async function createCinetpayPayment(
  input: CreateCinetpayPaymentInput
): Promise<CreateCinetpayPaymentResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) {
    return { error: "CinetPay n'est pas configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID manquants)." };
  }

  let response: Response;
  try {
    response = await fetch(`${CINETPAY_BASE_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: input.transactionId,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        notify_url: input.notifyUrl,
        return_url: input.returnUrl,
        channels: "MOBILE_MONEY",
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { error: "Impossible de contacter CinetPay. Réessaie dans quelques instants." };
  }

  const json = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    data?: { payment_url?: string };
  } | null;

  if (!json || json.code !== "201" || !json.data?.payment_url) {
    return { error: json?.message ?? "Échec de la création du paiement CinetPay." };
  }

  return { url: json.data.payment_url };
}

export type CinetpayCheckResult =
  | { status: "ACCEPTED"; amount: number; currency: string }
  | { status: "REFUSED" | "CANCELLED" | "PENDING" }
  | { error: string };

// Always call this from the notify webhook before trusting a payment as
// successful — CinetPay's notify POST body itself is not a trustworthy
// signal on its own (no signature to verify against), so the status must be
// re-fetched server-to-server here, the same reason the Stripe webhook
// verifies its signature before acting on an event.
export async function checkCinetpayTransaction(transactionId: string): Promise<CinetpayCheckResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) return { error: "CinetPay n'est pas configuré." };

  let response: Response;
  try {
    response = await fetch(`${CINETPAY_BASE_URL}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { error: "Impossible de contacter CinetPay pour vérifier la transaction." };
  }

  const json = (await response.json().catch(() => null)) as {
    data?: { status?: string; amount?: string | number; currency?: string };
  } | null;

  const status = json?.data?.status;
  if (status === "ACCEPTED") {
    return {
      status: "ACCEPTED",
      amount: Number(json?.data?.amount),
      currency: String(json?.data?.currency),
    };
  }
  if (status === "REFUSED" || status === "CANCELLED") return { status };
  return { status: "PENDING" };
}
