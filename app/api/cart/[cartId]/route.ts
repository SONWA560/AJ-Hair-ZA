import { NextRequest, NextResponse } from "next/server";
import { getShopifyCart } from "lib/firestore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> },
) {
  const params = await context.params;
  try {
    const cartId = params.cartId;
    const result = await getShopifyCart(cartId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}
