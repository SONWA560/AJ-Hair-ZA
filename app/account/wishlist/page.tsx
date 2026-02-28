import { getWishlistProductIds, getWishlistProducts } from "@/lib/wishlist-actions";
import { currentUser } from "@clerk/nextjs/server";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [products, wishlistIds] = await Promise.all([
    getWishlistProducts(user.id),
    getWishlistProductIds(user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Account
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold">My Wishlist</h1>

      {products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>Your wishlist is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} wishlistIds={wishlistIds} />
        </Grid>
      )}
    </div>
  );
}
