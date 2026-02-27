import { NextRequest, NextResponse } from "next/server";
import { getCart } from "@/lib/firebase/firestore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> },
) {
  const params = await context.params;
  try {
    const cartId = params.cartId;
    const cart = await getCart(cartId);

    if (!cart) {
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

    const shopifyCart = {
      id: cart.id,
      checkoutUrl: "/checkout",
      cost: {
        subtotalAmount: { amount: cart.total.toFixed(2), currencyCode: "ZAR" },
        totalAmount: { amount: cart.total.toFixed(2), currencyCode: "ZAR" },
        totalTaxAmount: { amount: "0.00", currencyCode: "ZAR" },
      },
      lines: {
        edges: cart.items.map((item: any) => ({
          node: {
            id: item.id,
            quantity: item.quantity,
            merchandise: {
              id: item.productId,
              title: item.title,
              price: { amount: item.price.toString(), currencyCode: "ZAR" },
            },
          },
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      totalQuantity: cart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
    };

    return NextResponse.json({
      data: { cart: shopifyCart },
      variables: { cartId },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { data: { cart: null }, error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}
