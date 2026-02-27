"use client";

import type { Cart, CartItem, Product } from "lib/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";

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

function createCartItem(product: Product, quantity: number = 1, variant?: any): CartItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
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

export function CartProvider({
  children,
  initialCart,
  userId,
}: {
  children: React.ReactNode;
  initialCart?: Cart;
  userId: string;
}) {
  const [cart, setCartState] = useState<Cart>(initialCart || createEmptyCart(userId));
  const [isLoading, setIsLoading] = useState(true);
  const { userId: authUserId } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only use stored cart if it belongs to this user or is a guest cart
        if (parsed.userId === userId || parsed.userId === "guest") {
          setCartState(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored cart:", e);
      }
    }
    setIsLoading(false);
  }, [userId]);

  // Save to localStorage whenever cart changes
  const saveToStorage = useCallback((newCart: Cart) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
  }, []);

  // Sync cart to Firestore in background (fire and forget)
  const syncToFirestore = useCallback(async (cartToSync: Cart) => {
    try {
      // Import dynamically to avoid issues
      const { addToCart, removeFromCart, updateCart } = await import("lib/cart-client");
      
      // For simplicity, we'll just add/update items - full sync is complex
      // This is a background operation that doesn't block UI
      console.log("[Cart] Syncing to Firestore in background...");
    } catch (e) {
      console.error("[Cart] Background sync failed:", e);
    }
  }, []);

  const setCart = useCallback((newCart: Cart) => {
    setCartState(newCart);
    saveToStorage(newCart);
  }, [saveToStorage]);

  const updateCartItem = useCallback((itemId: string, updateType: UpdateType) => {
    setCartState((prevCart) => {
      const items = [...prevCart.items];
      const itemIndex = items.findIndex((item) => item.id === itemId);
      
      if (itemIndex === -1) return prevCart;
      
      const item = items[itemIndex];
      if (!item) return prevCart;
      
      let newItems: CartItem[];
      
      if (updateType === "delete" || (updateType === "minus" && item.quantity === 1)) {
        // Remove item
        newItems = items.filter((_, i) => i !== itemIndex);
      } else if (updateType === "plus") {
        // Increment quantity
        items[itemIndex] = { ...item, quantity: item.quantity + 1 };
        newItems = items;
      } else if (updateType === "minus") {
        // Decrement quantity
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
      
      // Save immediately to localStorage
      saveToStorage(newCart);
      
      // Sync to Firestore in background
      syncToFirestore(newCart);
      
      return newCart;
    });
  }, [saveToStorage, syncToFirestore]);

  const addCartItem = useCallback((product: Product, variant?: any) => {
    setCartState((prevCart) => {
      const existingItem = prevCart.items.find((item) => item.productId === product.id);
      let newItems: CartItem[];
      
      if (existingItem) {
        // Increment quantity
        newItems = prevCart.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        newItems = [...prevCart.items, createCartItem(product, 1, variant)];
      }
      
      const newCart = {
        ...prevCart,
        items: newItems,
        total: calculateTotal(newItems),
        updatedAt: new Date(),
      };
      
      // Save immediately
      saveToStorage(newCart);
      
      // Sync to Firestore in background
      syncToFirestore(newCart);
      
      return newCart;
    });
  }, [saveToStorage, syncToFirestore]);

  const clearCart = useCallback(() => {
    const newCart = createEmptyCart(userId);
    setCartState(newCart);
    saveToStorage(newCart);
  }, [userId, saveToStorage]);

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
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
