import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionSearchClient } from "@/components/collection-search-client";

const collectionHairTypeMap: Record<string, string[]> = {
  "straight-hair": ["straight"],
  "curly-wavy": ["wavy", "body_wave", "deep_wave", "water_wave"],
  "kinky-coily": ["kinky_curly", "coily"],
  "new-arrivals": [],
};

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = params.collection;

  const title = collection
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${title} Collection`,
    description: `Browse our ${title} wig collection with premium quality hair products.`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
}) {
  const params = await props.params;
  const collection = params.collection;

  let products: any[] = [];
  
  const hairTypes = collectionHairTypeMap[collection];
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const response = await fetch(`${baseUrl}/api/products?action=collection&collection=${collection}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      products = data.products || [];
    }
  } catch (error) {
    console.error("Error fetching collection products:", error);
    products = [];
  }

  return (
    <CollectionSearchClient 
      initialProducts={products} 
      collection={collection} 
    />
  );
}
