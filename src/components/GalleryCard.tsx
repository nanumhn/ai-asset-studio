import Link from "next/link";
import Image from "next/image";
import type { CatalogImage } from "@/lib/catalog";

export default function GalleryCard({ image }: { image: CatalogImage }) {
  const free = image.priceCents === 0;
  return (
    <Link
      href={`/gallery/${image.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={image.thumbnailUrl ?? image.url}
          alt={image.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium">
          {free ? "Free" : `$${(image.priceCents / 100).toFixed(2)}`}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-medium">{image.title}</h3>
        <p className="text-xs text-white/40">{image.license} license</p>
      </div>
    </Link>
  );
}
