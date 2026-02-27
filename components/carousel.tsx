import Link from "next/link";
import { GridTileImage } from "./grid/tile";
import type { Product } from "lib/types";
import { baseUrl } from "lib/utils";

const API_BASE = `${baseUrl()}`;

async function fetchTrending(limit: number = 6) {
  const res = await fetch(
    `${API_BASE}/api/products?action=trending&limit=${limit}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

export async function Carousel() {
  const products = await fetchTrending(6);

  if (!products?.length) return null;

  const carouselProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {carouselProducts.map((product: Product, i) => (
          <li
            key={`${product.id}${i}`}
            className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
          >
            <Link
              href={`/product/${product.seo.handle}`}
              className="relative h-full w-full"
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
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
