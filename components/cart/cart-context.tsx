"use client";

import type { Cart, CartItem, Product } from "lib/types";
import { getCart as getCartFromFirestore, addToCart as addToCartToFirestore } from "lib/cart-client";
import {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic,
  useCallback,
  useEffect,
  startTransition,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | {
      type: "UPDATE_ITEM";
      payload: { itemId: string; updateType: UpdateType };
    }
  | {
      type: "ADD_ITEM";
      payload: { product: Product; variant?: any };
    }
  | {
      type: "SET_CART";
      payload: Cart;
    }
  | {
      type: "CLEAR_CART";
    };

type CartContextType = {
  cart: Cart | undefined;
  userId: string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "shara-commerce-cart";
const PENDING_CART_KEY = "shara-pending-cart";

function calculateItemCost(quantity: number, price: number): number {
  return price * quantity;
}

function updateCartItem(
  item: CartItem,
  updateType: UpdateType,
): CartItem | null {
  if (updateType === "delete") return null;

  const newQuantity =
    updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  return {
    ...item,
    quantity: newQuantity,
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  product: Product,
  variant?: any,
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, product.price);

  return {
    id: existingItem?.id || Math.random().toString(36).substring(2, 9),
    productId: product.id,
    title: product.title,
    price: product.price,
    quantity,
    image: product.images[0]?.url || "",
    variant: variant || {
      hair_type: product.specifications?.hair_type,
      length: product.specifications?.length,
      color: product.specifications?.color,
    },
  };
}

function updateCartTotals(lines: CartItem[]): {
  totalQuantity: number;
  total: number;
} {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + calculateItemCost(item.quantity, item.price),
    0,
  );

  return {
    totalQuantity,
    total: totalAmount,
  };
}

function createEmptyCart(userId?: string): Cart {
  return {
    id: userId || "guest",
    userId: userId || "guest",
    items: [],
    total: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function cartReducer(state: Cart | undefined, action: CartAction): Cart {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case "SET_CART":
      return action.payload;
    
    case "CLEAR_CART":
      return createEmptyCart(currentCart.userId);

    case "UPDATE_ITEM": {
      const { itemId, updateType } = action.payload;
      const updatedItems = currentCart.items
        .map((item) =>
          item.id === itemId ? updateCartItem(item, updateType) : item,
        )
        .filter(Boolean) as CartItem[];

      const { totalQuantity, total } = updateCartTotals(updatedItems);

      return {
        ...currentCart,
        items: updatedItems,
        total,
        updatedAt: new Date(),
      };
    }
    case "ADD_ITEM": {
      const { product, variant } = action.payload;
      const existingItem = currentCart.items.find(
        (item) => item.productId === product.id,
      );
      const updatedItem = createOrUpdateCartItem(existingItem, product, variant);

      const updatedItems = existingItem
        ? currentCart.items.map((item) =>
            item.productId === product.id ? updatedItem : item,
          )
        : [...currentCart.items, updatedItem];

      const { totalQuantity, total } = updateCartTotals(updatedItems);

      return {
        ...currentCart,
        items: updatedItems,
        total,
        updatedAt: new Date(),
      };
    }
    default:
      return currentCart;
  }
}

// Save cart to localStorage
function saveCartToLocalStorage(cart: Cart): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }
}

// Load cart from localStorage
function loadCartFromLocalStorage(): Cart | null {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
    }
  }
  return null;
}

// Save pending cart item (for guest users who try to add to cart)
export function savePendingCartItem(item: { product: Product; variant?: any; quantity: number }): void {
  if (typeof window !== "undefined") {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_CART_KEY) || "[]");
      pending.push(item);
      localStorage.setItem(PENDING_CART_KEY, JSON.stringify(pending));
    } catch (e) {
      console.error("Failed to save pending cart item:", e);
    }
  }
}

// Get and clear pending cart items
export function getAndClearPendingCartItems(): { product: Product; variant?: any; quantity: number }[] {
  if (typeof window !== "undefined") {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_CART_KEY) || "[]");
      localStorage.removeItem(PENDING_CART_KEY);
      return pending;
    } catch (e) {
      console.error("Failed to get pending cart items:", e);
    }
  }
  return [];
}

export function CartProvider({
  children,
  cart,
  userId,
}: {
  children: React.ReactNode;
  cart: Cart | undefined;
  userId: string;
}) {
  // Ensure we always have a valid context value
  const contextValue = useMemo(
    () => ({ cart, userId }),
    [cart, userId]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  // Create a fallback cart
  const fallbackCart: Cart = {
    id: "fallback",
    userId: "fallback",
    items: [],
    total: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Determine cart and userId from context, or use fallback
  let cart = fallbackCart;
  let userId = "fallback";
  let isValidContext = false;

  if (context !== undefined && context.cart !== undefined && context.userId !== undefined) {
    cart = context.cart;
    userId = context.userId;
    isValidContext = true;
  }
  
  // Always call hooks in the same order
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    cart,
    cartReducer,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && optimisticCart) {
      saveCartToLocalStorage(optimisticCart);
    }
  }, [optimisticCart]);

  // Ensure we always have a valid cart with items array
  const effectiveCart = optimisticCart || cart || fallbackCart;

  // Define all callbacks - they can use fallback implementations if not valid
  const noop = useCallback(() => {}, []);
  
  const syncWithFirestore = useCallback(async () => {
    if (!isValidContext) return;
    try {
      const freshCart = await getCartFromFirestore(userId);
      if (freshCart) {
        updateOptimisticCart({
          type: "SET_CART",
          payload: freshCart,
        });
        saveCartToLocalStorage(freshCart);
      }
    } catch (e) {
      console.error("Failed to sync cart with Firestore:", e);
    }
  }, [isValidContext, userId, updateOptimisticCart]);

  const updateCartItem = useCallback(
    (itemId: string, updateType: UpdateType) => {
      if (!isValidContext) return;
      startTransition(() => {
        updateOptimisticCart({
          type: "UPDATE_ITEM",
          payload: { itemId, updateType },
        });
      });
      try {
        addToCartToFirestore(userId, []).catch(e => console.error("Failed to update cart item:", e));
      } catch (e) {
        console.error("Failed to update cart item:", e);
      }
    },
    [isValidContext, updateOptimisticCart, userId],
  );

  const addCartItem = useCallback(
    (product: Product, variant?: any) => {
      if (!isValidContext) return;
      startTransition(() => {
        updateOptimisticCart({
          type: "ADD_ITEM",
          payload: { product, variant },
        });
      });
      const currentCart = effectiveCart || createEmptyCart(userId);
      saveCartToLocalStorage(currentCart);
    },
    [isValidContext, updateOptimisticCart, effectiveCart, userId],
  );

  const setCart = useCallback(
    (cart: Cart) => {
      if (!isValidContext) return;
      updateOptimisticCart({
        type: "SET_CART",
        payload: cart,
      });
      saveCartToLocalStorage(cart);
    },
    [isValidContext, updateOptimisticCart],
  );

  const clearCart = useCallback(() => {
    if (!isValidContext) return;
    updateOptimisticCart({
      type: "CLEAR_CART",
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [isValidContext, updateOptimisticCart]);

  return useMemo(
    () => ({
      cart: effectiveCart,
      updateCartItem,
      addCartItem,
      setCart,
      clearCart,
      syncWithFirestore,
      userId,
    }),
    [effectiveCart, updateCartItem, addCartItem, setCart, clearCart, syncWithFirestore, userId],
  );
}
