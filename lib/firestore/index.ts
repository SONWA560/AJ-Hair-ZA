// Main index file for the Firestore Shopify compatibility layer
// This file exports all the functions needed to replace Shopify GraphQL calls

// Export types
export * from "./types";

// Export mappers
export * from "./mappers";

// Export API functions
export * from "./shopify-api";

// Export query functions (organized by feature)
export * from "./queries/product";
export * from "./queries/cart";
export * from "./queries/collection";

// Re-export the main functions that components will use
import {
  getShopifyProduct,
  getShopifyProducts,
  getShopifyTrendingProducts,
} from "./shopify-api";
import {
  getShopifyCart,
  createShopifyCart,
  addToShopifyCart,
  removeFromShopifyCart,
  updateShopifyCart,
} from "./shopify-api";
import { getShopifyCollection, getShopifyCollections } from "./shopify-api";

// Product functions - these replace the original Shopify product queries
export const getProduct = getShopifyProduct;
export const getProducts = getShopifyProducts;
export const getTrendingProducts = getShopifyTrendingProducts;

// Cart functions - these replace the original Shopify cart mutations
export const getCart = getShopifyCart;
export const createCart = createShopifyCart;
export const addToCart = addToShopifyCart;
export const removeFromCart = removeFromShopifyCart;
export const updateCartQuantity = updateShopifyCart;

// Collection functions - these replace the original Shopify collection queries
export const getCollection = getShopifyCollection;
export const getCollections = getShopifyCollections;
