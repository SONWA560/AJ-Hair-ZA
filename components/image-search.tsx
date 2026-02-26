"use client";

import { useState, useRef } from "react";
import { Search, Sparkles, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  price: number;
  images: { url: string; alt: string }[];
  specifications: {
    hair_type: string;
    length: string;
    color: string;
  };
  inventory: {
    inStock: boolean;
  };
}

export function ImageSearch({
  onResults,
}: {
  onResults: (products: Product[]) => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsSearching(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ai-search/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image search failed");
      }

      const data = await response.json();
      
      if (data.aiInterpretation) {
        setInterpretation(data.aiInterpretation);
      }

      if (data.products) {
        onResults(data.products);
      }
    } catch (err) {
      console.error("Image search error:", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setInterpretation(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onResults([]);
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Find by Image</span>
          </div>
          
          <p className="text-sm text-gray-500">
            Upload a photo of a wig you like, and we'll find similar styles for you.
          </p>

          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Click to upload an image
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Upload preview"
                className="w-full h-48 object-contain rounded-lg bg-gray-100"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {preview && (
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing image...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Similar Wigs
                </>
              )}
            </Button>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {interpretation && (
            <p className="text-sm text-blue-600">
              <Sparkles className="inline h-4 w-4 mr-1" />
              {interpretation}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
