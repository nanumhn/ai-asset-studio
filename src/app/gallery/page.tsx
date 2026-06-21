import { listImages } from "@/lib/catalog";
import GalleryCard from "@/components/GalleryCard";
import AdSlot from "@/components/AdSlot";

export const metadata = {
  title: "Gallery — AI Asset Studio",
  description: "Browse AI-generated image packs and avatars.",
};

// Always render fresh so newly published images show up.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await listImages(60);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="mt-2 text-white/60">
          {images.length} assets · AI-generated, ready to license
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <GalleryCard key={img.id} image={img} />
        ))}
      </div>

      <div className="mt-12">
        <AdSlot slot="gallery-footer" className="w-full" />
      </div>
    </div>
  );
}
