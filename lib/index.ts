// Firebase-based ecommerce functions replacing Shopify
import {
  getProducts,
  getProduct,
  searchProducts,
  getTrendingProducts,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  logSearchQuery,
} from "./firebase/firestore";

import { Product, ProductFilters, Cart, CartItem } from "./types";

// Re-export functions for compatibility with existing components
export {
  getProducts,
  getProduct,
  searchProducts,
  getTrendingProducts,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  logSearchQuery,
};

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

// Collection and menu functions (Firebase versions)
export async function getCollections(): Promise<Collection[]> {
  return [
    {
      handle: "straight-hair",
      title: "Straight Hair",
      description: "Sleek and straight human hair wigs",
      path: "/search/straight-hair",
      hairTypes: ["straight"],
      image: "/images/straight-hair.jpg",
    },
    {
      handle: "curly-wavy",
      title: "Curly & Wavy",
      description: "Beautiful curly and wavy wigs",
      path: "/search/curly-wavy",
      hairTypes: ["wavy", "body_wave", "deep_wave", "water_wave"],
      image: "/images/curly-wavy.jpeg",
    },
    {
      handle: "kinky-coily",
      title: "Kinky & Coily",
      description: "Natural kinky curly and coily wigs",
      path: "/search/kinky-coily",
      hairTypes: ["kinky_curly", "coily"],
      image: "/images/kinky-coily.jpg",
    },
    {
      handle: "new-arrivals",
      title: "New Arrivals",
      description: "Latest wig collections",
      path: "/search/new-arrivals",
      hairTypes: [],
      image: "/images/new-arrivals.jpeg",
    },
  ];
}

export interface CollectionWithImage extends Collection {
  image?: string;
}

export async function getCollectionsWithImages(): Promise<CollectionWithImage[]> {
  const collections = await getCollections();
  
  // Use the static image from each collection, or fallback to first product image
  const collectionsWithImages = await Promise.all(
    collections.map(async (collection) => {
      // If collection has a static image, use it
      if (collection.image) {
        return {
          ...collection,
          image: collection.image,
        };
      }
      
      // Otherwise, try to get from first product
      const products = await getCollectionProducts(collection.handle);
      const firstProduct = products[0];
      const image = firstProduct && firstProduct.images.length > 0 ? firstProduct.images[0]?.url : undefined;
      return {
        ...collection,
        image,
      };
    })
  );
  
  return collectionsWithImages;
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
  const collectionMap: Record<string, Partial<ProductFilters>> = {
    "straight-hair": { hair_type: "straight" },
    "curly-wavy": { hair_type: ["wavy", "body_wave", "deep_wave", "water_wave"] },
    "kinky-coily": { hair_type: ["kinky_curly", "coily"] },
    "new-arrivals": {},
  };

  const filters = collectionMap[handle];
  if (filters) {
    return await getProducts(filters);
  }

  return [];
}

// Cart utility functions for client-side usage
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

// Image utility functions
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
) {
  // For Firebase Storage, we can use Google's image optimization
  if (url.includes("firebasestorage.googleapis.com")) {
    const baseUrl = url.split("?")[0];
    const params = new URLSearchParams();

    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());

    return `${baseUrl}?${params.toString()}`;
  }

  return url;
}

// SEO utilities
export function generateProductHandle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Category and filter utilities
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
