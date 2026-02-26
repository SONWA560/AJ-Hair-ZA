import {
  FirestoreProduct,
  ShopifyCompatibleProduct,
  ProductOption,
  ProductVariant,
  Money,
  Image,
  SEO,
  Connection,
  Edge,
  ShopifyCart,
  ShopifyCartItem,
  ShopifyCartProduct,
  ShopifyCollection,
} from "./types";
import { Cart, CartItem } from "../types";

// Product mapping functions
export function mapFirestoreToShopifyProduct(
  firestoreProduct: FirestoreProduct,
): ShopifyCompatibleProduct {
  // Use variants from Firestore if available, otherwise create a default
  const hasVariants = firestoreProduct.variants && firestoreProduct.variants.length > 0;
  
  // Map variants to Shopify format
  const variants: ProductVariant[] = hasVariants 
    ? firestoreProduct.variants.map(v => ({
        id: v.id,
        title: v.title,
        availableForSale: v.availableForSale,
        selectedOptions: v.selectedOptions,
        price: v.price,
      }))
    : [{
        id: firestoreProduct.id,
        title: `${firestoreProduct.specifications.hair_type} - ${firestoreProduct.specifications.length} - ${firestoreProduct.specifications.color}`,
        availableForSale: firestoreProduct.inventory.inStock,
        selectedOptions: [
          { name: "Hair Type", value: firestoreProduct.specifications.hair_type },
          { name: "Length", value: firestoreProduct.specifications.length },
          { name: "Color", value: firestoreProduct.specifications.color },
        ],
        price: {
          amount: firestoreProduct.price.toString(),
          currencyCode: firestoreProduct.currency,
        },
      }];

  // Use options from Firestore if available, otherwise create from specifications
  const options: ProductOption[] = hasVariants && firestoreProduct.options
    ? firestoreProduct.options.map(o => ({
        id: o.id,
        name: o.name,
        values: o.values,
      }))
    : [
        { id: "hair-type", name: "Hair Type", values: [firestoreProduct.specifications.hair_type] },
        { id: "length", name: "Length", values: [firestoreProduct.specifications.length] },
        { id: "color", name: "Color", values: [firestoreProduct.specifications.color] },
      ];

  // Map images from Firestore to Shopify format
  const images: Image[] = firestoreProduct.images?.map((img) => ({
    url: img.url,
    altText: img.alt,
    width: img.width,
    height: img.height,
  })) || [];

  const featuredImage = images[0] || { url: "", altText: "", width: 0, height: 0 };

  // Calculate price range from variants
  const prices = variants.map(v => parseFloat(v.price.amount));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    id: firestoreProduct.id,
    handle: firestoreProduct.seo.handle,
    availableForSale: firestoreProduct.inventory.inStock,
    title: firestoreProduct.title,
    description: firestoreProduct.description,
    descriptionHtml: firestoreProduct.description,
    options,
    priceRange: {
      maxVariantPrice: { amount: maxPrice.toString(), currencyCode: firestoreProduct.currency },
      minVariantPrice: { amount: minPrice.toString(), currencyCode: firestoreProduct.currency },
    },
    variants,
    featuredImage,
    images,
    seo: {
      title: firestoreProduct.seo.title || firestoreProduct.title,
      description: firestoreProduct.seo.description || firestoreProduct.description,
    },
    tags: firestoreProduct.metadata?.search_tags || [],
    updatedAt: firestoreProduct.timestamps.updatedAt.toISOString(),
  };
}

export function mapFirestoreToShopifyProducts(
  firestoreProducts: FirestoreProduct[],
): Connection<ShopifyCompatibleProduct> {
  const edges: Edge<ShopifyCompatibleProduct>[] = firestoreProducts.map(
    (product, index) => ({
      node: mapFirestoreToShopifyProduct(product),
      cursor: btoa(JSON.stringify({ index, id: product.id })),
    }),
  );

  return {
    edges,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

// Cart mapping functions
export function mapFirestoreToShopifyCart(
  firestoreCart: Cart,
  products: FirestoreProduct[],
): ShopifyCart {
  // Create a map of product IDs to products for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lines = firestoreCart.items
    .map((item, index) => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      const shopifyProduct = mapFirestoreToShopifyProduct(product);
      const shopifyCartProduct: ShopifyCartProduct = {
        id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        title: shopifyProduct.title,
        featuredImage: shopifyProduct.featuredImage,
      };

      const shopifyCartItem: ShopifyCartItem = {
        id: item.id,
        quantity: item.quantity,
        cost: {
          totalAmount: {
            amount: (item.price * item.quantity).toString(),
            currencyCode: product.currency,
          },
        },
        merchandise: {
          id: item.productId,
          title: item.title,
          price: {
            amount: item.price.toString(),
            currencyCode: product.currency,
          },
          selectedOptions: [
            {
              name: "Hair Type",
              value: item.variant.hair_type,
            },
            {
              name: "Length",
              value: item.variant.length,
            },
            {
              name: "Color",
              value: item.variant.color,
            },
          ],
          product: shopifyCartProduct,
        },
      };

      return {
        node: shopifyCartItem,
        cursor: btoa(JSON.stringify({ index, id: item.id })),
      };
    })
    .filter(Boolean) as Edge<ShopifyCartItem>[];

  const subtotalAmount = {
    amount: firestoreCart.total.toString(),
    currencyCode: "ZAR", // Default to ZAR, could be made dynamic
  };

  return {
    id: firestoreCart.id,
    checkoutUrl: `/checkout?cartId=${firestoreCart.id}`,
    cost: {
      subtotalAmount,
      totalAmount: subtotalAmount,
      totalTaxAmount: {
        amount: "0.00",
        currencyCode: "ZAR",
      },
    },
    lines: {
      edges: lines,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
    totalQuantity: firestoreCart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
  };
}

// Collection mapping functions
export function mapFirestoreToShopifyCollection(
  handle: string,
  title: string,
  description: string,
  products: FirestoreProduct[],
): ShopifyCollection {
  const updatedAt =
    products.length > 0
      ? Math.max(...products.map((p) => p.timestamps.updatedAt.getTime()))
      : Date.now();

  return {
    handle,
    title,
    description,
    seo: {
      title,
      description,
    },
    updatedAt: new Date(updatedAt).toISOString(),
  };
}

// Utility function to create mock variants from product specifications
export function createVariantsFromSpecifications(
  product: FirestoreProduct,
): ProductVariant[] {
  // For now, create a single default variant
  // In the future, this could generate multiple variants based on specification combinations
  return [
    {
      id: product.id,
      title: `${product.specifications.hair_type} - ${product.specifications.length} - ${product.specifications.color}`,
      availableForSale: product.inventory.inStock,
      selectedOptions: [
        {
          name: "Hair Type",
          value: product.specifications.hair_type,
        },
        {
          name: "Length",
          value: product.specifications.length,
        },
        {
          name: "Color",
          value: product.specifications.color,
        },
      ],
      price: {
        amount: product.price.toString(),
        currencyCode: product.currency,
      },
    },
  ];
}

// Helper function to format money consistently
export function formatMoney(amount: number, currencyCode: string): Money {
  return {
    amount: amount.toFixed(2),
    currencyCode,
  };
}

// Helper function to create SEO object
export function createSEO(product: FirestoreProduct): SEO {
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
  };
}
