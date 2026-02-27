"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Product } from "lib/types";
import { useState } from "react";
import {
  useCart,
  savePendingCartItem,
  getAndClearPendingCartItems,
} from "./cart-context";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function SubmitButton({
  inStock,
  isProcessing,
}: {
  inStock: boolean;
  isProcessing: boolean;
}) {
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
      disabled={isProcessing}
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        "hover:opacity-90": !isProcessing,
        "opacity-50": isProcessing,
      })}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      {isProcessing ? "Adding..." : "Add To Cart"}
    </button>
  );
}

export function AddToCart({
  product,
  selectedVariant,
}: {
  product: Product;
  selectedVariant?: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const { addCartItem } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const variants = (product as any).variants || [];

  const selectedVar =
    selectedVariant ||
    variants.find((variant: any) => {
      return variant.selectedOptions.every((option: any) => {
        const searchValue = searchParams.get(option.name.toLowerCase());
        return searchValue === option.value;
      });
    });

  const merchandiseId = selectedVar?.id || product.id;
  const isInStock = selectedVar
    ? (selectedVar.inventory?.inStock ?? selectedVar.availableForSale)
    : product.inventory.inStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      setMessage("Loading...");
      return;
    }

    // If not authenticated, save to pending and redirect to sign-in
    if (!userId) {
      savePendingCartItem({
        product,
        variant: selectedVar
          ? Object.fromEntries(
              selectedVar.selectedOptions.map((o: any) => [
                o.name.toLowerCase().replace(/\s+/g, "_"),
                o.value,
              ]),
            )
          : undefined,
        quantity: 1,
      });
      const currentUrl = window.location.href;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // User is authenticated, add to cart using context
    setIsProcessing(true);
    setMessage("");

    try {
      addCartItem(product, selectedVar);
      setMessage("Added to cart!");
      // Don't reload - the cart context will update immediately
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setMessage("Failed to add to cart");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <SubmitButton inStock={isInStock} isProcessing={isProcessing} />
      {message && (
        <p aria-live="polite" className="mt-2 text-center text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
