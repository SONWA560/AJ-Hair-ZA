// Client-side cart functions that use API routes

export interface CartLine {
  merchandiseId: string;
  quantity: number;
}

export interface UpdateCartLine {
  id: string;
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
    return null;
  }

  return response.json();
}

// Client-side function to remove items from cart
export async function removeFromCart(cartId: string, lineIds: string[]) {
  const response = await fetch(`/api/cart/${cartId}/remove`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lineIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to remove from cart");
  }

  return response.json();
}

// Client-side function to update cart item quantity
export async function updateCart(cartId: string, lines: UpdateCartLine[]) {
  const response = await fetch(`/api/cart/${cartId}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lines }),
  });

  if (!response.ok) {
    throw new Error("Failed to update cart");
  }

  return response.json();
}
