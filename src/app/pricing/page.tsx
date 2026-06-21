"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface PlanView {
  key: "BASIC" | "PRO";
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
}

const PLAN_VIEWS: PlanView[] = [
  {
    key: "BASIC",
    name: "Basic",
    price: 9,
    features: [
      "100 image downloads / month",
      "Standard license",
      "Access to full catalog",
      "Email support",
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: 19,
    highlight: true,
    features: [
      "Unlimited downloads",
      "Extended commercial license",
      "Priority AI generation queue",
      "n8n / API access",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: "BASIC" | "PRO") {
    setError(null);
    if (!session) {
      void signIn("google");
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Pricing</h1>
        <p className="mt-3 text-white/60">
          Start free, upgrade when you need more. Cancel anytime.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {PLAN_VIEWS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-8 ${
              plan.highlight
                ? "border-brand bg-brand/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            {plan.highlight ? (
              <span className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-medium">
                Most popular
              </span>
            ) : null}
            <h2 className="mt-3 text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-4xl font-bold">
              ${plan.price}
              <span className="text-base font-normal text-white/50">/mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-brand-light">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(plan.key)}
              disabled={loading === plan.key}
              className="mt-8 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading === plan.key
                ? "Redirecting…"
                : session
                  ? `Subscribe to ${plan.name}`
                  : "Sign in to subscribe"}
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      ) : null}

      <p className="mt-10 text-center text-xs text-white/40">
        Payments are processed securely by Stripe. Prices in USD.
      </p>
    </div>
  );
}
