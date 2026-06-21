import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getImage } from "@/lib/catalog";
import PurchasePanel from "@/components/PurchasePanel";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const image = await getImage(params.id);
  if (!image) return { title: "Not found — AI Asset Studio" };
  return {
    title: `${image.title} — AI Asset Studio`,
    description: image.description ?? "AI-generated asset.",
  };
}

export default async function ImageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const image = await getImage(params.id);
  if (!image) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/gallery" className="text-sm text-white/50 hover:text-white">
        ← Back to gallery
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={image.url}
              alt={image.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold">{image.title}</h1>
          {image.description ? (
            <p className="mt-2 text-white/60">{image.description}</p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-white/40">Dimensions</dt>
              <dd>
                {image.width} × {image.height}
              </dd>
            </div>
            <div>
              <dt className="text-white/40">License</dt>
              <dd>{image.license}</dd>
            </div>
            <div>
              <dt className="text-white/40">Tags</dt>
              <dd>{image.tags.length ? image.tags.join(", ") : "—"}</dd>
            </div>
          </dl>

          {image.prompt ? (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/40">
                Prompt
              </p>
              <p className="mt-1 text-sm text-white/70">{image.prompt}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <PurchasePanel image={image} />
          <AdSlot slot="detail-side" style={{ minHeight: 250 }} />
        </div>
      </div>
    </div>
  );
}
