"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartProvider, useCart } from "./cart-context";
import { getCart as getCartFromApi } from "lib/cart-client";
import type { Cart } from "lib/types";

function CartLoader({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [initialCart, setInitialCart] = useState<Cart | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchCart = async () => {
      const cartUserId = userId || "guest";
      try {
        const result = await getCartFromApi(cartUserId);
        
        if (result?.data?.cart) {
          const shopifyCart = result.data.cart;
          const cart: Cart = {
            id: shopifyCart.id || cartUserId,
            userId: cartUserId,
            items: shopifyCart.lines?.edges?.map((edge: any) => ({
              id: edge.node.id,
              productId: edge.node.merchandise?.product?.id || edge.node.merchandise?.id,
              title: edge.node.merchandise?.product?.title || edge.node.merchandise?.title || "Product",
              price: parseFloat(edge.node.merchandise?.price?.amount || edge.node.cost?.totalAmount?.amount || "0"),
              quantity: edge.node.quantity,
              image: edge.node.merchandise?.product?.featuredImage?.url || "",
              variant: {
                hair_type: edge.node.merchandise?.selectedOptions?.find((o: any) => o.name === "Hair Type")?.value,
                length: edge.node.merchandise?.selectedOptions?.find((o: any) => o.name === "Length")?.value,
                color: edge.node.merchandise?.selectedOptions?.find((o: any) => o.name === "Color")?.value,
              },
            })) || [],
            total: parseFloat(shopifyCart.cost?.totalAmount?.amount || "0"),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setInitialCart(cart);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [userId, isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <CartProvider initialCart={undefined} userId={userId || "guest"}>
        {children}
      </CartProvider>
    );
  }

  return (
    <CartProvider initialCart={initialCart} userId={userId || "guest"}>
      {children}
    </CartProvider>
  );
}

export function AuthenticatedCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartLoader>{children}</CartLoader>;
}
