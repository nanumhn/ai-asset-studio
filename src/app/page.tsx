import Link from "next/link";
import Image from "next/image";
import { PLANS } from "@/lib/stripe";
import { listImages } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";

export default async function HomePage() {
  const featured = (await listImages(6)).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-dark/40 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <span className="inline-block rounded-full border border-brand-light/40 bg-brand/10 px-4 py-1 text-xs font-medium text-brand-light">
            Powered by ComfyUI batch generation
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            AI image packs &amp; avatars,{" "}
            <span className="bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
              ready to license
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Generate batches of on-brand visuals, browse a growing catalog, and
            download with a clear commercial license. Built for creators,
            marketers, and indie studios.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/gallery"
              className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
            >
              Browse the gallery
            </Link>
            <Link
              href="/generate"
              className="rounded-lg border border-white/15 px-6 py-3 font-medium text-white/90 hover:bg-white/10"
            >
              Generate now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured grid */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Featured assets</h2>
          <Link href="/gallery" className="text-sm text-brand-light hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {featured.map((img) => (
            <Link
              key={img.id}
              href={`/gallery/${img.id}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
            >
              <Image
                src={img.thumbnailUrl ?? img.url}
                alt={img.title}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-medium opacity-0 transition group-hover:opacity-100">
                {img.title}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ad slot */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <AdSlot slot="home-mid" className="w-full" />
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          Simple, transparent pricing
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.key}
              className="rounded-2xl border border-white/10 bg-white/5 p-8"
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-4xl font-bold">
                ${plan.priceMonthly}
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
              <Link
                href="/pricing"
                className="mt-8 block rounded-lg bg-brand px-4 py-2.5 text-center font-medium text-white hover:bg-brand-dark"
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
