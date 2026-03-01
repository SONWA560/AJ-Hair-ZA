import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getAdminDb } from "@/lib/firebase/admin";
import { getProduct, getProducts } from "@/lib/firebase/firestore";
import { GridTileImage } from "components/grid/tile";
import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { FieldValue } from "firebase-admin/firestore";
import type { Product } from "lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, alt: alt } = product.images[0] || {};
  const indexable = product.inventory.inStock;

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  // Increment view count — fire and forget (don't block render)
  if (product.id) {
    void getAdminDb()
      .collection("products")
      .doc(product.id)
      .update({ "metadata.views": FieldValue.increment(1) })
      .catch(() => {});
  }

  const getCollectionFromHairType = (hairType?: string): string => {
    if (!hairType) return "new-arrivals";
    const map: Record<string, string> = {
      straight: "straight-hair",
      wavy: "curly-wavy",
      body_wave: "curly-wavy",
      deep_wave: "curly-wavy",
      water_wave: "curly-wavy",
      kinky_curly: "kinky-coily",
      coily: "kinky-coily",
    };
    return map[hairType] || "new-arrivals";
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images[0]?.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.inventory.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.currency,
      highPrice: product.price,
      lowPrice: product.price,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        <div className="mb-6">
          <Breadcrumb
            items={[
              {
                title:
                  product.specifications?.hair_type
                    ?.replace("_", " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Shop",
                href: `/search/${getCollectionFromHairType(product.specifications?.hair_type)}`,
              },
              { title: product.title },
            ]}
          />
        </div>
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-[4/5] h-full max-h-[700px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={product.images.slice(0, 5).map((image: any) => ({
                  src: image.url,
                  altText: image.alt,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription product={product} />
            </Suspense>
          </div>
        </div>
        <RelatedProducts
          id={product.id}
          hairType={product.specifications?.hair_type}
        />
      </div>
      <Footer />
    </>
  );
}

async function RelatedProducts({
  id,
  hairType,
}: {
  id: string;
  hairType?: string;
}) {
  let similar: Product[] = [];

  if (hairType) {
    try {
      const byHairType = await getProducts({ hair_type: hairType });
      similar = byHairType.filter((p) => p.id !== id).slice(0, 4);
    } catch {
      // fall through to empty
    }
  }

  if (similar.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Similar Wigs You Might Like</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {similar.map((product: Product) => (
          <li
            key={product.id}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
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
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
