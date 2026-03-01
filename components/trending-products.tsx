import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getTrendingProducts } from "lib/firebase/firestore";
import Link from "next/link";

export default async function TrendingProducts() {
  let products = [];
  try {
    products = await getTrendingProducts(8);
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-3xl">Trending Now</h2>
          <Link
            href="/search"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <ProductGridItems products={products} />
        </Grid>
      </div>
    </section>
  );
}
