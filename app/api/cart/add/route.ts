import { NextRequest, NextResponse } from "next/server";
import { addToShopifyCart } from "lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, lines } = body;

    if (!cartId || !lines) {
      return NextResponse.json(
        { error: "cartId and lines are required" },
        { status: 400 },
      );
    }

    const result = await addToShopifyCart(cartId, lines);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 },
    );
  }
}
