"use client";

import { toggleWishlist } from "@/lib/wishlist-actions";
import { useAuth } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  initialIsInWishlist?: boolean;
  className?: string;
}

export default function WishlistButton({
  productId,
  initialIsInWishlist = false,
  className = "",
}: WishlistButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
  const [isPending, setIsPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsPending(true);
    try {
      const result = await toggleWishlist(productId);
      setIsInWishlist(result.isInWishlist);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-opacity disabled:opacity-50 dark:bg-black/80 ${className}`}
    >
      <Heart
        size={16}
        className={
          isInWishlist ? "fill-red-500 text-red-500" : "text-neutral-500"
        }
      />
    </button>
  );
}
