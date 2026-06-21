"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import type { CatalogImage } from "@/lib/catalog";

const LICENSE_INFO: Record<
  CatalogImage["license"],
  { label: string; blurb: string }
> = {
  STANDARD: {
    label: "Standard",
    blurb: "Web, social and personal projects. Up to 500k impressions.",
  },
  EXTENDED: {
    label: "Extended",
    blurb: "Unlimited commercial use, products for resale, merchandise.",
  },
  EDITORIAL: {
    label: "Editorial",
    blurb: "News, blogs and non-commercial editorial use only.",
  },
};

export default function PurchasePanel({ image }: { image: CatalogImage }) {
  const { data: session } = useSession();
  const [license, setLicense] = useState<CatalogImage["license"]>(image.license);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const free = image.priceCents === 0;

  async function handleBuy() {
    setError(null);
    if (!session) {
      void signIn("google");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "payment", imageId: image.id }),
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
      setLoading(false);
    }
  }

  function handleDownload() {
    // Free assets — direct download.
    window.open(image.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">License</h2>
      <div className="mt-4 space-y-2">
        {(Object.keys(LICENSE_INFO) as CatalogImage["license"][]).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
              license === key
                ? "border-brand bg-brand/10"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <input
              type="radio"
              name="license"
              value={key}
              checked={license === key}
              onChange={() => setLicense(key)}
              className="mt-1 accent-brand"
            />
            <span>
              <span className="font-medium">{LICENSE_INFO[key].label}</span>
              <span className="block text-white/50">{LICENSE_INFO[key].blurb}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <span className="text-sm text-white/50">Price</span>
        <span className="text-2xl font-bold">
          {free ? "Free" : `$${(image.priceCents / 100).toFixed(2)}`}
        </span>
      </div>

      {free ? (
        <button
          onClick={handleDownload}
          className="mt-4 w-full rounded-lg bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Download
        </button>
      ) : (
        <button
          onClick={handleBuy}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Redirecting…" : session ? "Buy & download" : "Sign in to buy"}
        </button>
      )}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
