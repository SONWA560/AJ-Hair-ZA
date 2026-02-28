"use client";

import {
    CameraIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

export default function Search() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleImageSearch = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImageLoading(true);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
            const base64Data = result.split(",")[1];
            if (base64Data) {
              resolve(base64Data);
            } else {
              reject(new Error("Failed to read image as base64"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const response = await fetch("/api/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        const result = await response.json();
        const query: string = result.query || "wig";
        router.push("/search?q=" + encodeURIComponent(query));
      } catch (error) {
        console.error("Image search failed:", error);
        router.push("/search?q=wig");
      } finally {
        setImageLoading(false);
        // Reset the input so the same file can be re-selected later
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [router],
  );

  return (
    <Form
      action="/search"
      className="w-max-[550px] relative w-full lg:w-80 xl:w-full"
    >
      <input
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder="Search for products..."
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className="text-md w-full rounded-lg border bg-white px-4 py-2 text-black placeholder:text-neutral-500 md:text-sm dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSearch}
      />

      <div className="absolute right-0 top-0 mr-3 flex h-full items-center gap-2">
        {/* Camera / image-search button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageLoading}
          aria-label="Search by image"
          className="flex items-center justify-center text-neutral-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
        >
          {imageLoading ? (
            /* Minimal inline spinner */
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <CameraIcon className="h-4 w-4" />
          )}
        </button>

        {/* Submit / magnifying-glass icon */}
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <input
        placeholder="Search for products..."
        className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center gap-2">
        <CameraIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}
