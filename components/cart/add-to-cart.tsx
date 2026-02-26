"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Product } from "lib/types";
import { useActionState, useEffect, useState } from "react";
import { addToCart, getCart } from "lib/cart-client";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { savePendingCartItem, getAndClearPendingCartItems } from "./cart-context";

function SubmitButton({ inStock, isAuthenticated }: { inStock: boolean; isAuthenticated: boolean }) {
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!inStock) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out Of Stock
      </button>
    );
  }

  return (
    <button
      type="submit"
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        "hover:opacity-90": true,
      })}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  );
}

export function AddToCart({ product, selectedVariant }: { product: Product; selectedVariant?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const variants = (product as any).variants || [];
  
  const selectedVar = selectedVariant || variants.find((variant: any) => {
    return variant.selectedOptions.every((option: any) => {
      const searchValue = searchParams.get(option.name.toLowerCase());
      return searchValue === option.value;
    });
  });
  
  const isInStock = selectedVar 
    ? selectedVar.inventory?.inStock ?? selectedVar.availableForSale 
    : product.inventory.inStock;
    
  const merchandiseId = selectedVar?.id || product.id;
  const variantInfo = selectedVar?.selectedOptions || [];

  // Check if user is authenticated and handle pending cart items after login
  useEffect(() => {
    if (isLoaded && userId) {
      // User just logged in, check for pending items
      const pendingItems = getAndClearPendingCartItems();
      if (pendingItems.length > 0) {
        // Add pending items to cart
        const addPendingItems = async () => {
          try {
            for (const item of pendingItems) {
              await addToCart(userId, [{
                merchandiseId: item.product.id,
                quantity: item.quantity
              }]);
            }
            // Refresh the page to show updated cart
            window.location.reload();
          } catch (e) {
            console.error("Failed to add pending items:", e);
          }
        };
        addPendingItems();
      }
    }
  }, [isLoaded, userId]);

  const [message, formAction] = useActionState(async () => {
    if (!isLoaded) {
      return "Loading...";
    }

    // If not authenticated, save to pending and redirect to sign-in
    if (!userId) {
      // Save the item to localStorage as pending
      savePendingCartItem({
        product,
        variant: variantInfo.length > 0 ? Object.fromEntries(
          variantInfo.map((o: any) => [o.name.toLowerCase().replace(/\s+/g, '_'), o.value])
        ) : undefined,
        quantity: 1
      });
      
      // Redirect to sign-in with return URL
      const currentUrl = window.location.href;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return "Please sign in to add items to cart";
    }

    // User is authenticated, add to cart
    setIsProcessing(true);
    try {
      await addToCart(userId, [{ 
        merchandiseId: merchandiseId, 
        quantity: 1
      }]);
      // Force a page reload to refresh cart state
      window.location.reload();
      return "Added to cart!";
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return "Failed to add to cart";
    } finally {
      setIsProcessing(false);
    }
  }, null);

  return (
    <form action={formAction}>
      <SubmitButton inStock={isInStock} isAuthenticated={!!userId} />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
