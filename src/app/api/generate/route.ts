import { NextResponse } from "next/server";
import { generate, comfyHealthy } from "@/lib/comfyui";
import { isComfyConfigured } from "@/lib/env";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
// Generation can take a while; do not cache.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface GenerateBody {
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  batchSize?: number;
  /** When true and DB is available, persist the produced images to the catalog. */
  persist?: boolean;
}

export async function POST(req: Request) {
  if (!isComfyConfigured()) {
    return NextResponse.json(
      { error: "ComfyUI is not configured. Set COMFYUI_API_URL." },
      { status: 503 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  // Fast-fail if ComfyUI is unreachable so the client gets a clear 503
  // instead of waiting out the full generation timeout.
  if (!(await comfyHealthy())) {
    return NextResponse.json(
      {
        error:
          "ComfyUI is unreachable. Ensure it is running at COMFYUI_API_URL (default http://localhost:8188).",
      },
      { status: 503 },
    );
  }

  try {
    const result = await generate({
      prompt,
      negativePrompt: body.negativePrompt,
      width: body.width,
      height: body.height,
      steps: body.steps,
      cfg: body.cfg,
      seed: body.seed,
      batchSize: body.batchSize,
    });

    let persisted: { id: string }[] = [];
    if (body.persist) {
      const userId = await getCurrentUserId();
      try {
        persisted = await Promise.all(
          result.images.map((img) =>
            prisma.image.create({
              data: {
                title: prompt.slice(0, 80),
                prompt,
                url: img.url,
                thumbnailUrl: img.url,
                width: body.width ?? 1024,
                height: body.height ?? 1024,
                source: "COMFYUI",
                status: "PUBLISHED",
                uploaderId: userId ?? undefined,
                meta: { promptId: result.promptId },
              },
              select: { id: true },
            }),
          ),
        );
      } catch (e) {
        // DB not available — return generation result anyway.
        console.error("persist failed", e);
      }
    }

    return NextResponse.json({
      promptId: result.promptId,
      images: result.images,
      persistedIds: persisted.map((p) => p.id),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET() {
  const healthy = await comfyHealthy();
  return NextResponse.json({ comfyui: healthy ? "up" : "down" });
}
