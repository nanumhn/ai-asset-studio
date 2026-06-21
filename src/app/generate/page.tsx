"use client";

import { useState } from "react";
import Image from "next/image";

interface GenImage {
  filename: string;
  url: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GenImage[]>([]);

  async function handleGenerate() {
    setError(null);
    setImages([]);
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: negative || undefined,
          persist: true,
        }),
      });
      const data = (await res.json()) as {
        images?: GenImage[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setImages(data.images ?? []);
    } catch {
      setError("Network error. Is ComfyUI running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Generate</h1>
      <p className="mt-2 text-white/60">
        Describe what you want. Generation runs on your ComfyUI instance.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/60">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="a cozy isometric coffee shop, warm lighting, ultra detailed"
            className="w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/60">
            Negative prompt (optional)
          </label>
          <input
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
            placeholder="text, watermark, blurry"
            className="w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Generating… (this can take a minute)" : "Generate"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {images.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <a
              key={img.filename}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded-xl border border-white/10"
            >
              <Image
                src={img.url}
                alt={img.filename}
                fill
                sizes="33vw"
                className="object-cover"
                unoptimized
              />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
