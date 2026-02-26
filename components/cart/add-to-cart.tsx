"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Product } from "lib/types";
import { useState } from "react";
import { useCart } from "./cart-context";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function SubmitButton({ inStock, onClick }: { inStock: boolean; onClick?: () => void }) {
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
      type="button"
      onClick={onClick}
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
  const { addCartItem } = useCart();
  const [message, setMessage] = useState("");
  
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
    
  const variantInfo = selectedVar?.selectedOptions || [];

  const handleAddToCart = () => {
    if (!isLoaded) {
      setMessage("Loading...");
      return;
    }

    // If not authenticated, redirect to sign-in
    if (!userId) {
      const currentUrl = window.location.href;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Add to cart instantly using context
    const variant = variantInfo.length > 0 ? Object.fromEntries(
      variantInfo.map((o: any) => [o.name.toLowerCase().replace(/\s+/g, '_'), o.value])
    ) : undefined;

    addCartItem(product, variant);
    setMessage("Added to cart!");
    
    // Clear message after 2 seconds
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div>
      <SubmitButton inStock={isInStock} onClick={handleAddToCart} />
      {message && (
        <p className="mt-2 text-center text-green-600">{message}</p>
      )}
    </div>
  );
}
