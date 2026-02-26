import { NextRequest, NextResponse } from "next/server";
import { getShopifyCart } from "lib/firestore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> },
) {
  const params = await context.params;
  const cartId = params.cartId;
  
  try {
    const result = await getShopifyCart(cartId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({
      data: {
        cart: {
          id: cartId,
          checkoutUrl: "/checkout",
          cost: {
            subtotalAmount: { amount: "0.00", currencyCode: "ZAR" },
            totalAmount: { amount: "0.00", currencyCode: "ZAR" },
            totalTaxAmount: { amount: "0.00", currencyCode: "ZAR" },
          },
          lines: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
          totalQuantity: 0,
        },
      },
      variables: { cartId },
    });
  }
}
