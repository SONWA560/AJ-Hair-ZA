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
import {
  getProducts,
  getProduct,
  getCart,
  addToCart as addToFirestoreCart,
  removeFromCart as removeFromFirestoreCart,
  updateCartQuantity as updateFirestoreCartQuantity,
  searchProducts,
  getTrendingProducts,
} from "../firebase/firestore";
import { ProductFilters } from "../types";

// Shopify-compatible Product API
export async function getShopifyProduct(
  handle: string,
): Promise<ShopifyProductOperation> {
  const firestoreProduct = await getProduct(handle);

  if (!firestoreProduct) {
    throw new Error(`Product with handle "${handle}" not found`);
  }

  const shopifyProduct = mapFirestoreToShopifyProduct(firestoreProduct);

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
  let firestoreProducts: any[] = [];

  if (query) {
    // Search products
    firestoreProducts = await searchProducts(query);
  } else {
    // Get all products (could add filtering/sorting later)
    firestoreProducts = await getProducts();
  }

  const shopifyProducts = mapFirestoreToShopifyProducts(firestoreProducts);

  return {
    data: { products: shopifyProducts },
    variables: { query, reverse, sortKey },
  };
}

export async function getShopifyTrendingProducts(
  limit: number = 10,
): Promise<ShopifyProductsOperation> {
  const firestoreProducts = await getTrendingProducts(limit);
  const shopifyProducts = mapFirestoreToShopifyProducts(firestoreProducts);

  return {
    data: { products: shopifyProducts },
    variables: {},
  };
}

export async function getShopifyProductRecommendations(
  productId: string,
): Promise<ShopifyProductsOperation> {
  // For now, return trending products as recommendations
  // In the future, this could use more sophisticated recommendation logic
  const firestoreProducts = await getTrendingProducts(4);
  const shopifyProducts = mapFirestoreToShopifyProducts(firestoreProducts);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse: undefined, sortKey: undefined },
  };
}

// Shopify-compatible Collection API
export async function getShopifyCollection(
  handle: string,
): Promise<ShopifyCollectionOperation> {
  // For now, create collections based on hair types
  // In the future, this could be more sophisticated
  const products = await getProducts({ hair_type: handle });
  const collection = mapFirestoreToShopifyCollection(
    handle,
    `${handle.charAt(0).toUpperCase() + handle.slice(1)} Wigs`,
    `High-quality ${handle} wigs for every style and occasion.`,
    products,
  );

  return {
    data: { collection },
    variables: { handle },
  };
}

export async function getShopifyCollections(): Promise<ShopifyCollectionsOperation> {
  // Define available collections based on hair types
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
  const products = await getProducts({ hair_type: handle });
  const shopifyProducts = mapFirestoreToShopifyProducts(products);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse, sortKey },
  };
}

// Shopify-compatible Cart API
export async function getShopifyCart(
  cartId: string,
): Promise<ShopifyCartOperation> {
  const firestoreCart = await getCart(cartId);

  if (!firestoreCart) {
    throw new Error(`Cart with ID "${cartId}" not found`);
  }

  // Get all products referenced in cart for mapping
  const productIds = firestoreCart.items.map((item) => item.productId);
  const allProducts = await getProducts();
  const cartProducts = allProducts.filter((p) => productIds.includes(p.id));

  const shopifyCart = mapFirestoreToShopifyCart(firestoreCart, cartProducts);

  return {
    data: { cart: shopifyCart },
    variables: { cartId },
  };
}

export async function createShopifyCart(): Promise<ShopifyCreateCartOperation> {
  // Create an empty cart
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
  // For simplicity, we'll use the cartId as userId
  // In a real implementation, you'd have proper user authentication

  for (const line of lines) {
    await addToFirestoreCart(cartId, line.merchandiseId, line.quantity);
  }

  const updatedCart = await getShopifyCart(cartId);

  return {
    data: { cartLinesAdd: { cart: updatedCart.data.cart } },
    variables: { cartId, lines },
  };
}

export async function removeFromShopifyCart(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyRemoveFromCartOperation> {
  for (const lineId of lineIds) {
    await removeFromFirestoreCart(cartId, lineId);
  }

  const updatedCart = await getShopifyCart(cartId);

  return {
    data: { cartLinesRemove: { cart: updatedCart.data.cart } },
    variables: { cartId, lineIds },
  };
}

export async function updateShopifyCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<ShopifyUpdateCartOperation> {
  for (const line of lines) {
    await updateFirestoreCartQuantity(cartId, line.id, line.quantity);
  }

  const updatedCart = await getShopifyCart(cartId);

  return {
    data: { cartLinesUpdate: { cart: updatedCart.data.cart } },
    variables: { cartId, lines },
  };
}

// Utility function to get filtered products in Shopify format
export async function getShopifyFilteredProducts(
  filters: ProductFilters,
): Promise<ShopifyProductsOperation> {
  const firestoreProducts = await getProducts(filters);
  const shopifyProducts = mapFirestoreToShopifyProducts(firestoreProducts);

  return {
    data: { products: shopifyProducts },
    variables: { query: undefined, reverse: undefined, sortKey: undefined },
  };
}
