// Shopify-compatible collection query functions that replace the original Shopify GraphQL queries
// These functions use Firestore data but return Shopify-compatible responses

import {
  getShopifyCollection,
  getShopifyCollections,
  getShopifyCollectionProducts,
} from "../shopify-api";

// Collection queries that match the original Shopify query structure
export const getCollection = async (handle: string) => {
  return await getShopifyCollection(handle);
};

export const getCollections = async () => {
  return await getShopifyCollections();
};

export const getCollectionProducts = async (
  handle: string,
  variables?: {
    reverse?: boolean;
    sortKey?: string;
  },
) => {
  return await getShopifyCollectionProducts(
    handle,
    variables?.reverse,
    variables?.sortKey,
  );
};
