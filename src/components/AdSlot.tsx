"use client";

import { useEffect } from "react";

/**
 * Google AdSense slot.
 *
 * Renders an <ins class="adsbygoogle"> and pushes to adsbygoogle on mount.
 * The publisher client id comes from NEXT_PUBLIC_ADSENSE_CLIENT; when it is
 * missing we render a labeled placeholder instead of a broken ad unit so the
 * layout still looks intentional in dev / preview.
 *
 * Load the AdSense script once in the root layout (see layout.tsx) — gated on
 * the same env var.
 */
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface AdSlotProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not ready yet; ignore.
    }
  }, [client]);

  if (!client) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/5 text-xs text-white/40 ${className}`}
        style={{ minHeight: 90, ...style }}
        aria-hidden
      >
        Ad slot ({slot}) — set NEXT_PUBLIC_ADSENSE_CLIENT to enable
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
