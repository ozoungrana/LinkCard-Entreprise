import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

// Lazily constructed so the app doesn't crash at import time when the key
// isn't configured yet — callers get a clear error only when billing is
// actually used, not on every cold start.
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe n'est pas configuré (STRIPE_SECRET_KEY manquant). Ajoute tes clés API Stripe dans les variables d'environnement pour activer la facturation."
    );
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return stripe;
}
