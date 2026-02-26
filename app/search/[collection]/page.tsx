import { getProductsByHairType } from "lib/firebase/firestore";
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
    if (collection === "new-arrivals") {
      // For new arrivals, get all products sorted by newest
      const { getProducts } = await import("lib/firebase/firestore");
      products = await getProducts({ sortBy: "newest" });
    } else if (hairTypes) {
      products = await getProductsByHairType(collection);
    } else {
      products = await getProductsByHairType(collection);
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
