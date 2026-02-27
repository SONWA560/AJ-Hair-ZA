import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductsByHairType, getTrendingProducts } from "@/lib/firebase/firestore";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const collection = searchParams.get("collection");
  const handle = searchParams.get("handle");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    switch (action) {
      case "trending":
        const trending = await getTrendingProducts(limit);
        return NextResponse.json({ products: trending });

      case "collection":
        if (!collection) {
          return NextResponse.json({ error: "Collection required" }, { status: 400 });
        }
        const products = await getProductsByHairType(collection);
        return NextResponse.json({ products });

      case "product":
        const { getProductByHandle } = await import("@/lib/firebase/firestore");
        if (!handle) {
          return NextResponse.json({ error: "Handle required" }, { status: 400 });
        }
        const product = await getProductByHandle(handle);
        return NextResponse.json({ product });

      case "all":
      default:
        const allProducts = await getProducts();
        return NextResponse.json({ products: allProducts });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
