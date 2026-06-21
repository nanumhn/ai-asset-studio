import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";

export interface CatalogImage {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  prompt?: string | null;
  width: number;
  height: number;
  tags: string[];
  license: "STANDARD" | "EXTENDED" | "EDITORIAL";
  priceCents: number;
  createdAt: string;
}

const SAMPLE_TITLES = [
  "Neon Cityscape Pack",
  "Minimal Portrait Set",
  "Abstract Gradient Backgrounds",
  "Fantasy Avatar Collection",
  "Product Mockup Scenes",
  "Cyberpunk Avatars",
];

const SAMPLE_TAGS: string[][] = [
  ["city", "neon", "night"],
  ["portrait", "minimal"],
  ["abstract", "background"],
  ["fantasy", "avatar"],
  ["product", "mockup"],
  ["cyberpunk", "avatar"],
];

/**
 * Sample catalog used when the DB is not configured / reachable.
 * Uses picsum.photos seeded URLs so the gallery renders real images in dev
 * without ComfyUI or a database.
 */
export const SAMPLE_IMAGES: CatalogImage[] = Array.from({ length: 12 }).map(
  (_, i) => {
    const seed = `ai-asset-${i + 1}`;
    return {
      id: `sample-${i + 1}`,
      title: SAMPLE_TITLES[i % SAMPLE_TITLES.length],
      description:
        "A sample AI-generated asset. Connect a database to publish your own ComfyUI output.",
      url: `https://picsum.photos/seed/${seed}/1024/1024`,
      thumbnailUrl: `https://picsum.photos/seed/${seed}/512/512`,
      prompt: "cinematic lighting, ultra detailed, 8k",
      width: 1024,
      height: 1024,
      tags: SAMPLE_TAGS[i % SAMPLE_TAGS.length],
      license: i % 3 === 0 ? "EXTENDED" : "STANDARD",
      priceCents: i % 4 === 0 ? 0 : 500,
      createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
    };
  },
);

function isSampleId(id: string): boolean {
  return id.startsWith("sample-");
}

export async function listImages(limit = 60): Promise<CatalogImage[]> {
  if (!isDatabaseConfigured()) return SAMPLE_IMAGES;
  try {
    const rows = await prisma.image.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (rows.length === 0) return SAMPLE_IMAGES;
    return rows.map(serialize);
  } catch {
    return SAMPLE_IMAGES;
  }
}

export async function getImage(id: string): Promise<CatalogImage | null> {
  if (isSampleId(id) || !isDatabaseConfigured()) {
    return SAMPLE_IMAGES.find((s) => s.id === id) ?? null;
  }
  try {
    const row = await prisma.image.findUnique({ where: { id } });
    return row ? serialize(row) : null;
  } catch {
    return SAMPLE_IMAGES.find((s) => s.id === id) ?? null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(row: any): CatalogImage {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    thumbnailUrl: row.thumbnailUrl,
    prompt: row.prompt,
    width: row.width,
    height: row.height,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    license: row.license,
    priceCents: row.priceCents,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}
