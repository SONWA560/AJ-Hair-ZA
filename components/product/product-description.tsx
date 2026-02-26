"use client";

"use client";

import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { VariantSelector } from "components/product/variant-selector";
import { Product } from "lib/types";
import { useSearchParams } from "next/navigation";

export function ProductDescription({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  
  const options = (product as any).options || [];
  const variants = (product as any).variants || [];
  
  const selectedVariant = variants.find((variant: any) => {
    return variant.selectedOptions.every((option: any) => {
      const searchValue = searchParams.get(option.name.toLowerCase());
      return searchValue === option.value;
    });
  });
  
  const currentPrice = selectedVariant 
    ? parseFloat(selectedVariant.price.amount) 
    : product.price;
    
  const isInStock = selectedVariant 
    ? selectedVariant.inventory?.inStock ?? selectedVariant.availableForSale
    : product.inventory.inStock;
    
  const stockQty = selectedVariant?.inventory?.quantity ?? product.inventory.quantity;

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            <Price
              amount={currentPrice.toString()}
              currencyCode={product.currency}
            />
          </div>
          
          {isInStock ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              In Stock {stockQty > 0 ? `(${stockQty})` : ''}
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {options.length > 0 && variants.length > 1 && (
        <div className="mb-6">
          <VariantSelector options={options} variants={variants} />
        </div>
      )}

      {product.description ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.description}
        />
      ) : null}
      <AddToCart product={product} selectedVariant={selectedVariant} />
    </>
  );
}
