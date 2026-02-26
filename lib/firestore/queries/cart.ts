// Shopify-compatible cart query functions that replace the original Shopify GraphQL mutations
// These functions use Firestore data but return Shopify-compatible responses

import {
  getShopifyCart,
  createShopifyCart,
  addToShopifyCart,
  removeFromShopifyCart,
  updateShopifyCart,
} from "../shopify-api";

// Cart queries that match the original Shopify query structure
export const getCart = async (cartId: string) => {
  return await getShopifyCart(cartId);
};

export const createCart = async () => {
  return await createShopifyCart();
};

export const cartAddItem = async (
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
) => {
  return await addToShopifyCart(cartId, lines);
};

export const cartRemoveItem = async (cartId: string, lineIds: string[]) => {
  return await removeFromShopifyCart(cartId, lineIds);
};

export const cartUpdateItem = async (
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[],
) => {
  return await updateShopifyCart(cartId, lines);
};
