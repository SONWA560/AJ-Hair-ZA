import { NextRequest, NextResponse } from "next/server";
import { addToCart, getCart } from "@/lib/firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, lines } = body;

    if (!cartId || !lines || !lines.length) {
      return NextResponse.json(
        { error: "cartId and lines are required" },
        { status: 400 },
      );
    }

    const line = lines[0];
    const cart = await addToCart(cartId, line.merchandiseId, line.quantity);

    return NextResponse.json({ data: { cart }, variables: { cartId } });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 },
    );
  }
}
