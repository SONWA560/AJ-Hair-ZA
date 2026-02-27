"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartProvider } from "./cart-context";
import { getCart as getCartFromFirestore } from "lib/firebase/firestore";
import type { Cart } from "lib/types";

export function AuthenticatedCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();
  const [userCart, setUserCart] = useState<Cart | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    setIsHydrated(true);
    
    const fetchCart = async () => {
      const cartUserId = userId || "guest";
      try {
        const cart = await getCartFromFirestore(cartUserId);
        setUserCart(cart || undefined);
      } catch (error) {
        console.error("Error fetching cart:", error);
        setUserCart(undefined);
      }
    };
    
    fetchCart();
  }, [userId, isLoaded]);

  if (!isHydrated) {
    // Return a basic provider while hydrating
    return (
      <CartProvider cart={undefined} userId={userId || "guest"}>
        {children}
      </CartProvider>
    );
  }

  return (
    <CartProvider cart={userCart} userId={userId || "guest"}>
      {children}
    </CartProvider>
  );
}
