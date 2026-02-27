"use client";

import type { Cart, CartItem, Product } from "lib/types";
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartContextType = {
  cart: Cart | undefined;
  userId: string;
  updateCartItem: (itemId: string, updateType: UpdateType) => void;
  addCartItem: (product: Product, variant?: any) => void;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "ajhair-cart";
const PENDING_CART_KEY = "ajhair-pending-cart";

function createEmptyCart(userId?: string): Cart {
  return {
    id: userId || "guest",
    userId: userId || "guest",
    items: [],
    total: 0,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function savePendingCartItem(item: {
  product: Product;
  variant?: any;
  quantity?: number;
}) {
  if (typeof window !== "undefined") {
    try {
      const pending = JSON.parse(
        localStorage.getItem(PENDING_CART_KEY) || "[]",
      );
      pending.push(item);
      localStorage.setItem(PENDING_CART_KEY, JSON.stringify(pending));
    } catch (e) {
      console.error("Failed to save pending cart item:", e);
    }
  }
}

export function getAndClearPendingCartItems(): {
  product: Product;
  variant?: any;
  quantity: number;
}[] {
  if (typeof window !== "undefined") {
    try {
      const pending = JSON.parse(
        localStorage.getItem(PENDING_CART_KEY) || "[]",
      );
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
  initialCart,
  userId,
}: {
  children: React.ReactNode;
  initialCart?: Cart;
  userId: string;
}) {
  const [cart, setCartState] = useState<Cart>(
    initialCart || createEmptyCart(userId),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.userId === userId || parsed.userId === "guest") {
          setCartState(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored cart:", e);
      }
    }
    setIsLoading(false);
  }, [userId]);

  const saveToStorage = useCallback((newCart: Cart) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
  }, []);

  const updateCartItem = useCallback(
    (itemId: string, updateType: UpdateType) => {
      setCartState((prevCart) => {
        const items = [...prevCart.items];
        const itemIndex = items.findIndex((item) => item.id === itemId);

        if (itemIndex === -1) return prevCart;

        const item = items[itemIndex];
        if (!item) return prevCart;

        let newItems: CartItem[];

        if (
          updateType === "delete" ||
          (updateType === "minus" && item.quantity === 1)
        ) {
          newItems = items.filter((_, i) => i !== itemIndex);
        } else if (updateType === "plus") {
          items[itemIndex] = { ...item, quantity: item.quantity + 1 };
          newItems = items;
        } else if (updateType === "minus") {
          items[itemIndex] = { ...item, quantity: item.quantity - 1 };
          newItems = items;
        } else {
          return prevCart;
        }

        const newCart = {
          ...prevCart,
          items: newItems,
          total: calculateTotal(newItems),
          updatedAt: new Date(),
        };

        saveToStorage(newCart);
        return newCart;
      });
    },
    [saveToStorage],
  );

  const addCartItem = useCallback(
    (product: Product, variant?: any) => {
      setCartState((prevCart) => {
        const items = [...prevCart.items];
        const existingItem = items.find(
          (item) => item.productId === product.id,
        );

        let newItems: CartItem[];

        if (existingItem) {
          newItems = items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        } else {
          const newItem: CartItem = {
            id: Math.random().toString(36).substring(2, 9),
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: product.images[0]?.url || "",
            variant: variant || {
              hair_type: product.specifications?.hair_type,
              length: product.specifications?.length,
              color: product.specifications?.color,
            },
          };
          newItems = [...items, newItem];
        }

        const newCart = {
          ...prevCart,
          items: newItems,
          total: calculateTotal(newItems),
          updatedAt: new Date(),
        };

        saveToStorage(newCart);
        return newCart;
      });
    },
    [saveToStorage],
  );

  const setCart = useCallback(
    (newCart: Cart) => {
      setCartState(newCart);
      saveToStorage(newCart);
    },
    [saveToStorage],
  );

  const clearCart = useCallback(() => {
    const emptyCart = createEmptyCart(userId);
    setCartState(emptyCart);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [userId]);

  return (
    <CartContext.Provider
      value={{
        cart,
        userId,
        updateCartItem,
        addCartItem,
        setCart,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
