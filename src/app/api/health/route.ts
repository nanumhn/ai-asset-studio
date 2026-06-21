import { NextResponse } from "next/server";
import {
  isAuthConfigured,
  isStripeConfigured,
  isDatabaseConfigured,
  isComfyConfigured,
  isN8nConfigured,
} from "@/lib/env";
import { comfyHealthy } from "@/lib/comfyui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Smoke / readiness endpoint — reports which integrations are configured. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    configured: {
      auth: isAuthConfigured(),
      stripe: isStripeConfigured(),
      database: isDatabaseConfigured(),
      comfyui: isComfyConfigured(),
      n8n: isN8nConfigured(),
    },
    comfyuiReachable: await comfyHealthy(),
  });
}
