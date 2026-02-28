import { Metadata } from "next";

import { CollectionSearchClient } from "@/components/collection-search-client";
import { getProductsByHairType } from "@/lib/firebase/firestore";

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

  const products = await getProductsByHairType(collection);

  return (
    <CollectionSearchClient
      initialProducts={products}
      collection={collection}
    />
  );
}
