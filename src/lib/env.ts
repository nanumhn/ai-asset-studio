/**
 * Centralized environment access + "is configured" guards.
 *
 * We never hardcode secrets. Routes should call the matching `isXxxConfigured()`
 * guard and return HTTP 503 with a clear message when a required key is missing,
 * instead of crashing the build or leaking partial behavior.
 */

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC ?? "",
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ?? "",
  COMFYUI_API_URL: process.env.COMFYUI_API_URL ?? "http://localhost:8188",
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET ?? "",
  NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export function isAuthConfigured(): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.NEXTAUTH_SECRET,
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}

export function isComfyConfigured(): boolean {
  return Boolean(env.COMFYUI_API_URL);
}

export function isN8nConfigured(): boolean {
  return Boolean(env.N8N_WEBHOOK_SECRET);
}
