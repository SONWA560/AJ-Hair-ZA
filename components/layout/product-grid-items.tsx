import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import WishlistButton from "components/wishlist-button";
import { Product } from "lib/types";
import Link from "next/link";

function formatHairType(hairType?: string): string {
  if (!hairType) return "";
  return hairType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AttributePills({ product }: { product: Product }) {
  const pills: string[] = [];
  const spec = product.specifications;
  if (spec?.hair_type) pills.push(formatHairType(spec.hair_type));
  if (spec?.length) pills.push(spec.length);
  if (spec?.color) pills.push(spec.color);
  if (spec?.density) pills.push(spec.density);

  const visible = pills.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-2 pb-2">
      {visible.map((pill) => (
        <span
          key={pill}
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {pill}
        </span>
      ))}
      {!product.inventory?.inStock && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-600 dark:bg-red-900/30 dark:text-red-400">
          Out of stock
        </span>
      )}
    </div>
  );
}

export default function ProductGridItems({
  products,
  wishlistIds,
}: {
  products: Product[];
  wishlistIds?: string[];
}) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.id} className="animate-fadeIn">
          <div className="relative h-full w-full">
            <Link
              className="relative inline-block h-full w-full"
              href={`/product/${product.seo.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.price.toString(),
                  currencyCode: product.currency,
                }}
                src={product.images[0]?.url || ""}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Link>
            {/* Attribute pills row below the image tile */}
            <div className="absolute bottom-10 left-0 right-0 z-10">
              <AttributePills product={product} />
            </div>
            {/* Wishlist heart button — top right corner */}
            <div className="absolute right-2 top-2 z-10">
              <WishlistButton
                productId={product.id}
                initialIsInWishlist={wishlistIds?.includes(product.id) ?? false}
              />
            </div>
          </div>
        </Grid.Item>
      ))}
    </>
  );
}
