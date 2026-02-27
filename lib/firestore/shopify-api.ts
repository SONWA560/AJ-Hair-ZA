import {
  ShopifyProductOperation,
  ShopifyProductsOperation,
  ShopifyCollectionOperation,
  ShopifyCollectionsOperation,
  ShopifyCartOperation,
  ShopifyCreateCartOperation,
  ShopifyAddToCartOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation,
  ShopifyCollection,
  ShopifyCart,
} from "./types";
import {
  mapFirestoreToShopifyProduct,
  mapFirestoreToShopifyProducts,
  mapFirestoreToShopifyCart,
  mapFirestoreToShopifyCollection,
} from "./mappers";
import { ProductFilters } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "";

async function fetchAPI(action: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_BASE}/api/products`);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

// Shopify-compatible Product API
export async function getShopifyProduct(
  handle: string,
): Promise<ShopifyProductOperation> {
  const { product } = await fetchAPI("product", { handle });

  if (!product) {
    throw new Error(`Product with handle "${handle}" not found`);
  }

  const shopifyProduct = mapFirestoreToShopifyProduct(product);

  return {
    data: { product: shopifyProduct },
    variables: { handle },
  };
}

export async function getShopifyProducts(
  query?: string,
  sortKey?: string,
  reverse?: boolean,
): Promise<ShopifyProductsOperation> {
  const { products } = await fetchAPI("all");

  const shopifyProducts = mapFirestoreToShopifyProducts(products || []);

  return {
    data: { products: shopifyProducts },
    variables: { query, reverse, sortKey },
  };
}

export async function getShopifyTrendingProducts(
  limit: number = 10,
): Promise<ShopifyProductsOperation> {
  const { products } = await fetchAPI("trending", { limit: limit.toString() });
  const shopifyProducts = mapFirestoreToShopifyProducts(products || []);

  return {
    data: { products: shopifyProducts },
    variables: {},
  };
}

export async function getShopifyProductRecommendations(
  productId: string,
): Promise<ShopifyProductsOperation> {
  const { products } = await fetchAPI("trending", { limit: "4" });
  const shopifyProducts = mapFirestoreToShopifyProducts(products || []);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse: undefined, sortKey: undefined },
  };
}

// Shopify-compatible Collection API
export async function getShopifyCollection(
  handle: string,
): Promise<ShopifyCollectionOperation> {
  const { products } = await fetchAPI("collection", { collection: handle });
  const collection = mapFirestoreToShopifyCollection(
    handle,
    `${handle.charAt(0).toUpperCase() + handle.slice(1)} Wigs`,
    `High-quality ${handle} wigs for every style and occasion.`,
    products || [],
  );

  return {
    data: { collection },
    variables: { handle },
  };
}

export async function getShopifyCollections(): Promise<ShopifyCollectionsOperation> {
  const hairTypes = [
    "kinky_curly",
    "straight",
    "coily",
    "wavy",
    "body_wave",
    "deep_wave",
    "water_wave",
  ];

  const collections: ShopifyCollection[] = hairTypes.map((hairType) =>
    mapFirestoreToShopifyCollection(
      hairType,
      `${hairType.charAt(0).toUpperCase() + hairType.slice(1).replace("_", " ")} Wigs`,
      `Premium ${hairType.replace("_", " ")} wigs collection.`,
      [],
    ),
  );

  const edges = collections.map((collection, index) => ({
    node: collection,
    cursor: btoa(JSON.stringify({ index, id: collection.handle })),
  }));

  return {
    data: {
      collections: {
        edges,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  };
}

export async function getShopifyCollectionProducts(
  handle: string,
  reverse?: boolean,
  sortKey?: string,
): Promise<ShopifyProductsOperation> {
  const { products } = await fetchAPI("collection", { collection: handle });
  const shopifyProducts = mapFirestoreToShopifyProducts(products || []);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse, sortKey },
  };
}

// Shopify-compatible Cart API - these still need server-side implementation
export async function getShopifyCart(
  cartId: string,
): Promise<ShopifyCartOperation> {
  throw new Error("Cart operations should use API routes");
}

export async function createShopifyCart(): Promise<ShopifyCreateCartOperation> {
  const emptyCart: ShopifyCart = {
    id: undefined,
    checkoutUrl: "/checkout",
    cost: {
      subtotalAmount: { amount: "0.00", currencyCode: "ZAR" },
      totalAmount: { amount: "0.00", currencyCode: "ZAR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "ZAR" },
    },
    lines: {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
    totalQuantity: 0,
  };

  return {
    data: { cartCreate: { cart: emptyCart } },
  };
}

export async function addToShopifyCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<ShopifyAddToCartOperation> {
  throw new Error("Cart operations should use API routes");
}

export async function removeFromShopifyCart(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyRemoveFromCartOperation> {
  throw new Error("Cart operations should use API routes");
}

export async function updateShopifyCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<ShopifyUpdateCartOperation> {
  throw new Error("Cart operations should use API routes");
}

export async function getShopifyFilteredProducts(
  filters: ProductFilters,
): Promise<ShopifyProductsOperation> {
  const { products } = await fetchAPI("all");
  let filtered = products || [];

  if (filters?.hair_type) {
    const hairTypes = Array.isArray(filters.hair_type) ? filters.hair_type : [filters.hair_type];
    filtered = filtered.filter((p: any) => 
      hairTypes.includes(p.specifications?.hair_type)
    );
  }

  const shopifyProducts = mapFirestoreToShopifyProducts(filtered);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse: undefined, sortKey: undefined },
  };
}
