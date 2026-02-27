// Firebase-based ecommerce functions replacing Shopify
// Use API routes for products - cart functions provided separately

import { Product, ProductFilters, Cart, CartItem } from "./types";

// Type exports for compatibility
export type { Product, ProductFilters, Cart, CartItem };

export interface Collection {
  handle: string;
  title: string;
  description: string;
  path: string;
  hairTypes?: string[];
  image?: string;
}

export interface CollectionWithImage extends Collection {
  image?: string;
}

export async function getCollections(): Promise<Collection[]> {
  return [
    {
      handle: "straight-hair",
      title: "Straight Hair",
      description: "Sleek and straight human hair wigs",
      path: "/search/straight-hair",
      hairTypes: ["straight"],
    },
    {
      handle: "curly-wavy",
      title: "Curly & Wavy",
      description: "Beautiful curly and wavy wigs",
      path: "/search/curly-wavy",
      hairTypes: ["wavy", "body_wave", "deep_wave", "water_wave"],
    },
    {
      handle: "kinky-coily",
      title: "Kinky & Coily",
      description: "Natural kinky curly and coily wigs",
      path: "/search/kinky-coily",
      hairTypes: ["kinky_curly", "coily"],
    },
    {
      handle: "new-arrivals",
      title: "New Arrivals",
      description: "Latest wig collections",
      path: "/search/new-arrivals",
      hairTypes: [],
    },
  ];
}

export async function getCollectionsWithImages(): Promise<CollectionWithImage[]> {
  const collections = await getCollections();
  
  const imageMap: Record<string, string> = {
    "straight-hair": "/images/straight-hair.jpg",
    "curly-wavy": "/images/curly-wavy.jpeg",
    "kinky-coily": "/images/kinky-coily.jpg",
    "new-arrivals": "/images/new-arrivals.jpeg",
  };
  
  return collections.map((collection) => ({
    ...collection,
    image: imageMap[collection.handle] || `/images/${collection.handle}.jpg`,
  }));
}

export async function getCollection(handle: string) {
  const collections = await getCollections();
  return collections.find((c) => c.handle === handle) || null;
}

export async function getCollectionProducts(
  handle: string,
  reverse?: boolean,
  sortKey?: string,
): Promise<Product[]> {
  return [];
}

export function createCartCookieId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function formatPrice(amount: number, currency: string = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
) {
  if (url.includes("firebasestorage.googleapis.com")) {
    const baseUrl = url.split("?")[0];
    const params = new URLSearchParams();

    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());

    return `${baseUrl}?${params.toString()}`;
  }

  return url;
}

export function generateProductHandle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getHairTypes() {
  return [
    { value: "kinky_curly", label: "Kinky Curly" },
    { value: "straight", label: "Straight" },
    { value: "coily", label: "Coily" },
    { value: "wavy", label: "Wavy" },
    { value: "body_wave", label: "Body Wave" },
    { value: "deep_wave", label: "Deep Wave" },
    { value: "water_wave", label: "Water Wave" },
  ];
}

export function getLengths() {
  return ["14in", "16in", "18in", "20in", "22in", "24in", "26in"];
}

export function getColors() {
  return [
    "Natural Black",
    "Jet Black",
    "Brown",
    "Blonde",
    "Burgundy",
    "613 Blonde",
  ];
}

export function getDensities() {
  return ["150%", "180%", "200%", "250%"];
}

export function getLaceTypes() {
  return ["13x4 Transparent", "13x6 HD", "4x4 Closure", "360 Lace"];
}

export function getOccasions() {
  return [
    { value: "daily", label: "Daily Wear" },
    { value: "professional", label: "Professional" },
    { value: "wedding", label: "Wedding" },
    { value: "party", label: "Party" },
    { value: "protective", label: "Protective Style" },
  ];
}
