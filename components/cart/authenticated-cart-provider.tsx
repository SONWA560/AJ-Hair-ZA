"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartProvider } from "./cart-context";
import { getCart as getCartFromApi } from "lib/cart-client";
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
        const result = await getCartFromApi(cartUserId);
        if (result?.data?.cart) {
          const shopifyCart = result.data.cart;
          const cart: Cart = {
            id: shopifyCart.id || cartUserId,
            userId: cartUserId,
            items:
              shopifyCart.lines?.edges?.map((edge: any) => ({
                id: edge.node.id,
                productId:
                  edge.node.merchandise?.product?.id ||
                  edge.node.merchandise?.id,
                title:
                  edge.node.merchandise?.product?.title ||
                  edge.node.merchandise?.title ||
                  "Product",
                price: parseFloat(
                  edge.node.merchandise?.price?.amount ||
                    edge.node.cost?.totalAmount?.amount ||
                    "0",
                ),
                quantity: edge.node.quantity,
                image: edge.node.merchandise?.product?.featuredImage?.url || "",
              })) || [],
            total: parseFloat(shopifyCart.cost?.totalAmount?.amount || "0"),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUserCart(cart);
        } else {
          setUserCart(undefined);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setUserCart(undefined);
      }
    };

    fetchCart();
  }, [userId, isLoaded]);

  if (!isHydrated) {
    return (
      <CartProvider initialCart={undefined} userId={userId || "guest"}>
        {children}
      </CartProvider>
    );
  }

  return (
    <CartProvider initialCart={userCart} userId={userId || "guest"}>
      {children}
    </CartProvider>
  );
}
