import { NextRequest, NextResponse } from "next/server";
import { removeFromShopifyCart } from "lib/firestore";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> },
) {
  const params = await context.params;
  const cartId = params.cartId;
  
  try {
    const body = await request.json();
    const { lineIds } = body;

    if (!lineIds || !Array.isArray(lineIds)) {
      return NextResponse.json(
        { error: "lineIds array is required" },
        { status: 400 },
      );
    }

    const result = await removeFromShopifyCart(cartId, lineIds);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 },
    );
  }
}
