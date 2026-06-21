import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

/**
 * Lazily-constructed Stripe client.
 *
 * We do NOT throw at import time when the key is missing — that would break the
 * build. Routes call `getStripe()` and handle a null return with a 503.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return _stripe;
}

export type PlanKey = "BASIC" | "PRO";

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceMonthly: number; // USD
  priceId: string; // Stripe Price ID from env
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDef> = {
  BASIC: {
    key: "BASIC",
    name: "Basic",
    priceMonthly: 9,
    priceId: env.STRIPE_PRICE_BASIC,
    features: [
      "100 image downloads / month",
      "Standard license",
      "Access to full catalog",
      "Email support",
    ],
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceMonthly: 19,
    priceId: env.STRIPE_PRICE_PRO,
    features: [
      "Unlimited downloads",
      "Extended commercial license",
      "Priority AI generation queue",
      "n8n / API access",
      "Priority support",
    ],
  },
};

export function planFromPriceId(priceId: string | null | undefined): PlanKey | "FREE" {
  if (!priceId) return "FREE";
  if (priceId === env.STRIPE_PRICE_BASIC) return "BASIC";
  if (priceId === env.STRIPE_PRICE_PRO) return "PRO";
  return "FREE";
}
