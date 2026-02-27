"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "lib/types";

async function fetchProducts() {
  const res = await fetch('/api/products?action=all', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const data = await fetchProducts();
      
      // Simple client-side filter
      if (searchQuery) {
        const filtered = (data as Product[]).filter((p: Product) => 
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.specifications?.hair_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.specifications?.color?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setProducts(filtered);
      } else {
        setProducts(data);
      }
      setIsLoading(false);
    }
    loadProducts();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Find Your Perfect Wig</h1>
        <p className="text-center text-gray-500 mb-6">
          Search by name, hair type, or color
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search wigs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {searchQuery && (
        <p className="text-center">
          {products.length === 0
            ? "No wigs found. Try a different search."
            : `Found ${products.length} wig${products.length === 1 ? '' : 's'}`}
          {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <p className="text-center text-gray-500 py-12">
          Start searching for wigs
        </p>
      )}
    </div>
  );
}
