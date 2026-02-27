// Client-side cart functions that use API routes
// This avoids importing Firebase Admin on the client side

export interface CartLine {
  merchandiseId: string;
  quantity: number;
}

export interface AddToCartRequest {
  cartId: string;
  lines: CartLine[];
}

// Client-side function to add items to cart
export async function addToCart(cartId: string, lines: CartLine[]) {
  const response = await fetch("/api/cart/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cartId, lines }),
  });

  if (!response.ok) {
    throw new Error("Failed to add to cart");
  }

  return response.json();
}

// Client-side function to get cart
export async function getCart(cartId: string) {
  const response = await fetch(`/api/cart/${cartId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch cart");
  }

  return response.json();
}
