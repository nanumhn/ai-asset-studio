import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env, isN8nConfigured, isDatabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * n8n publish webhook.
 *
 * n8n (or any automation) calls this to publish new images into the catalog.
 * Auth is a shared secret passed via the `x-n8n-secret` header, compared
 * against N8N_WEBHOOK_SECRET (constant-time-ish length guard + equality).
 *
 * Body:
 *   { images: [{ title, url, prompt?, thumbnailUrl?, tags?, width?, height?,
 *                license?, priceCents? }] }
 */

interface IncomingImage {
  title?: string;
  url?: string;
  prompt?: string;
  thumbnailUrl?: string;
  tags?: string[];
  width?: number;
  height?: number;
  license?: "STANDARD" | "EXTENDED" | "EDITORIAL";
  priceCents?: number;
}

interface PublishBody {
  images?: IncomingImage[];
}

function authorized(req: Request): boolean {
  const provided = req.headers.get("x-n8n-secret") ?? "";
  const expected = env.N8N_WEBHOOK_SECRET;
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(req: Request) {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "n8n webhook is not configured. Set N8N_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL." },
      { status: 503 },
    );
  }

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const images = (body.images ?? []).filter(
    (img): img is IncomingImage & { title: string; url: string } =>
      Boolean(img.title && img.url),
  );

  if (images.length === 0) {
    return NextResponse.json(
      { error: "At least one image with { title, url } is required" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.$transaction(
      images.map((img) =>
        prisma.image.create({
          data: {
            title: img.title,
            url: img.url,
            prompt: img.prompt,
            thumbnailUrl: img.thumbnailUrl ?? img.url,
            tags: img.tags ?? [],
            width: img.width ?? 1024,
            height: img.height ?? 1024,
            license: img.license ?? "STANDARD",
            priceCents: img.priceCents ?? 0,
            source: "N8N",
            status: "PUBLISHED",
          },
          select: { id: true },
        }),
      ),
    );

    return NextResponse.json({
      published: created.length,
      ids: created.map((c) => c.id),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "publish failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
