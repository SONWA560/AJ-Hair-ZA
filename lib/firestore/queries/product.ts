// Shopify-compatible query functions that replace the original Shopify GraphQL queries
// These functions use Firestore data but return Shopify-compatible responses

import {
  getShopifyProduct,
  getShopifyProducts,
  getShopifyProductRecommendations,
} from "../shopify-api";

// Product queries that match the original Shopify query structure
export const getProduct = async (handle: string) => {
  return await getShopifyProduct(handle);
};

export const getProducts = async (variables?: {
  sortKey?: string;
  reverse?: boolean;
  query?: string;
}) => {
  return await getShopifyProducts(
    variables?.query,
    variables?.sortKey,
    variables?.reverse,
  );
};

export const getProductRecommendations = async (productId: string) => {
  return await getShopifyProductRecommendations(productId);
};
