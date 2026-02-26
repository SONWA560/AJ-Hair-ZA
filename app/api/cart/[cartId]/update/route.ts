import { NextRequest, NextResponse } from "next/server";
import { updateShopifyCart } from "lib/firestore";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> },
) {
  const params = await context.params;
  const cartId = params.cartId;
  
  try {
    const body = await request.json();
    const { lines } = body;

    if (!lines || !Array.isArray(lines)) {
      return NextResponse.json(
        { error: "lines array is required" },
        { status: 400 },
      );
    }

    const result = await updateShopifyCart(cartId, lines);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 },
    );
  }
}
