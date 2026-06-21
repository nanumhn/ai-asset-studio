/**
 * ComfyUI API client.
 *
 * ComfyUI exposes an HTTP API (default http://localhost:8188):
 *   POST /prompt            -> queue a workflow, returns { prompt_id }
 *   GET  /history/{id}      -> returns execution result incl. output node images
 *   GET  /view?filename=... -> serves the actual image bytes
 *
 * We submit a standard text-to-image workflow (graph in the "prompt" API
 * format), poll /history until the prompt finishes, then build /view URLs for
 * the produced images.
 *
 * This module has no Next.js dependencies so it stays unit-testable.
 */

import { env } from "@/lib/env";

export interface GenerateOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  batchSize?: number;
  /** Checkpoint filename as known to ComfyUI (e.g. "sd_xl_base_1.0.safetensors"). */
  ckptName?: string;
}

export interface GeneratedImage {
  filename: string;
  subfolder: string;
  type: string;
  url: string;
}

export interface GenerateResult {
  promptId: string;
  images: GeneratedImage[];
}

const DEFAULTS = {
  width: 1024,
  height: 1024,
  steps: 25,
  cfg: 7,
  batchSize: 1,
  ckptName: "sd_xl_base_1.0.safetensors",
};

function baseUrl(): string {
  return env.COMFYUI_API_URL.replace(/\/$/, "");
}

/** Build a standard SDXL-ish text2image workflow in ComfyUI "prompt" format. */
export function buildWorkflow(opts: GenerateOptions): Record<string, unknown> {
  const width = opts.width ?? DEFAULTS.width;
  const height = opts.height ?? DEFAULTS.height;
  const steps = opts.steps ?? DEFAULTS.steps;
  const cfg = opts.cfg ?? DEFAULTS.cfg;
  const seed =
    opts.seed ?? Math.floor(Math.random() * 1_000_000_000_000_000);
  const batchSize = opts.batchSize ?? DEFAULTS.batchSize;
  const ckptName = opts.ckptName ?? DEFAULTS.ckptName;

  return {
    "4": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: ckptName },
    },
    "5": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: batchSize },
    },
    "6": {
      class_type: "CLIPTextEncode",
      inputs: { text: opts.prompt, clip: ["4", 1] },
    },
    "7": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "text, watermark, low quality, blurry",
        clip: ["4", 1],
      },
    },
    "3": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
    },
    "8": {
      class_type: "VAEDecode",
      inputs: { samples: ["3", 0], vae: ["4", 2] },
    },
    "9": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "ai-asset-studio", images: ["8", 0] },
    },
  };
}

export function viewUrl(img: {
  filename: string;
  subfolder: string;
  type: string;
}): string {
  const params = new URLSearchParams({
    filename: img.filename,
    subfolder: img.subfolder ?? "",
    type: img.type ?? "output",
  });
  return `${baseUrl()}/view?${params.toString()}`;
}

async function queuePrompt(
  workflow: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${baseUrl()}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ComfyUI /prompt failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { prompt_id?: string };
  if (!data.prompt_id) {
    throw new Error("ComfyUI /prompt returned no prompt_id");
  }
  return data.prompt_id;
}

interface HistoryEntry {
  outputs?: Record<
    string,
    { images?: Array<{ filename: string; subfolder: string; type: string }> }
  >;
}

async function fetchHistory(
  promptId: string,
): Promise<HistoryEntry | null> {
  const res = await fetch(`${baseUrl()}/history/${promptId}`);
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, HistoryEntry>;
  return data[promptId] ?? null;
}

/**
 * Submit a generation and poll until images are ready.
 * @param timeoutMs hard cap so a serverless route never hangs forever.
 */
export async function generate(
  opts: GenerateOptions,
  { timeoutMs = 120_000, pollIntervalMs = 1500 }: { timeoutMs?: number; pollIntervalMs?: number } = {},
): Promise<GenerateResult> {
  const workflow = buildWorkflow(opts);
  const promptId = await queuePrompt(workflow);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const entry = await fetchHistory(promptId);
    if (entry?.outputs) {
      const images: GeneratedImage[] = [];
      for (const nodeOutput of Object.values(entry.outputs)) {
        for (const img of nodeOutput.images ?? []) {
          images.push({ ...img, url: viewUrl(img) });
        }
      }
      if (images.length > 0) {
        return { promptId, images };
      }
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`ComfyUI generation timed out after ${timeoutMs}ms`);
}

/** Lightweight reachability check for health endpoints. */
export async function comfyHealthy(timeoutMs = 4000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${baseUrl()}/system_stats`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
