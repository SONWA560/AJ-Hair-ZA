"use client";

import { Camera, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function HomeSearchHero() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setIsAnalysing(true);

      try {
        // Strip the data URL prefix to get raw base64
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const { query: imageQuery } = await res.json();
        router.push(`/search?q=${encodeURIComponent(imageQuery || "wig")}`);
      } catch {
        router.push("/search");
      } finally {
        setIsAnalysing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="bg-neutral-50 py-14 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight lg:text-3xl">
            Find your perfect wig
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Describe what you&apos;re looking for, or upload a photo to find similar styles.
          </p>

          {/* Text search */}
          <form onSubmit={handleTextSearch} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. long straight wig for a wedding, natural black..."
                className="w-full rounded-full border bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Search
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or search by image
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Image upload */}
          {imagePreview ? (
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Uploaded preview"
                className="h-36 w-36 rounded-xl object-cover shadow"
              />
              {isAnalysing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 text-white">
                  <Loader2 className="mb-1 h-6 w-6 animate-spin" />
                  <span className="text-xs">Analysing…</span>
                </div>
              ) : (
                <button
                  onClick={clearImage}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow dark:bg-neutral-700"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 px-10 py-7 text-sm text-muted-foreground transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-neutral-600"
            >
              <Camera className="h-7 w-7" />
              <span className="font-medium">Upload a photo</span>
              <span className="text-xs">JPG, PNG, WEBP supported</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>
    </section>
  );
}
