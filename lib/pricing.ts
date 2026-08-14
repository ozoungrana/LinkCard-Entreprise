// Shared between the client-side upgrade dialog (price display) and the
// CinetPay server action (charge amount) — kept plain so it's safe to import
// from both without pulling in "use server" or "server-only".

// Chapter 10 §2 pricing grid (9€/19€) converted to XOF — a rough peg, not an
// exact conversion. Confirm/adjust these amounts against the target
// market's actual willingness to pay before going live.
const MIN_BUSINESS_SEATS = 3;

export const CINETPAY_PRICING: Record<"pro" | "business", { amount: number; label: string }> = {
  pro: { amount: 6000, label: "Pro" },
  business: { amount: 12500, label: "Business" },
};

export function cinetpayMinSeats() {
  return MIN_BUSINESS_SEATS;
}

export function cinetpayPriceFor(plan: "pro" | "business", seats = MIN_BUSINESS_SEATS) {
  const pricing = CINETPAY_PRICING[plan];
  const quantity = plan === "business" ? Math.max(MIN_BUSINESS_SEATS, seats) : 1;
  return pricing.amount * quantity;
}

export function formatXof(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}
