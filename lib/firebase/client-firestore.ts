import { db } from "./client";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { Cart, CartItem, Product } from "../types";

export async function getCart(userId: string): Promise<Cart | null> {
  console.log("[client-firestore] getCart called with userId:", userId);
  try {
    if (!db) {
      console.log("[client-firestore] db not initialized!");
      return null;
    }
  } catch (e) {
    console.log("[client-firestore] db check failed:", e);
    return null;
  }
  
  try {
    const cartRef = doc(db, "carts", userId);
    console.log("[client-firestore] fetching cart ref:", cartRef.path);
    const cartSnap = await getDoc(cartRef);
    console.log("[client-firestore] cart exists:", cartSnap.exists());
    
    if (!cartSnap.exists()) {
      return null;
    }
    
    const data = cartSnap.data();
    console.log("[client-firestore] cart data:", JSON.stringify(data));
    return {
      id: cartSnap.id,
      userId: data.userId,
      items: data.items || [],
      total: data.total || 0,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    } as Cart;
  } catch (error) {
    console.error("[client-firestore] Error fetching cart:", error);
    return null;
  }
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  if (!db) throw new Error("Firestore not initialized");
  
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  
  let cart: Cart;
  if (cartSnap.exists()) {
    const data = cartSnap.data();
    cart = {
      id: cartSnap.id,
      userId: data.userId,
      items: data.items || [],
      total: data.total || 0,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  } else {
    cart = {
      id: userId,
      userId,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  // Get product details
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) {
    throw new Error("Product not found");
  }
  
  const productData = productSnap.data() as Product;
  
  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === productId
  );
  
  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex]!.quantity += quantity;
  } else {
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      title: productData.title,
      price: productData.price,
      quantity,
      image: productData.images?.[0]?.url || "",
      variant: {
        hair_type: productData.specifications?.hair_type,
        length: productData.specifications?.length,
        color: productData.specifications?.color,
      },
    };
    cart.items.push(newItem);
  }
  
  // Calculate total
  cart.total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  cart.updatedAt = new Date();
  
  await setDoc(cartRef, {
    ...cart,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  });
  
  return cart;
}

export async function removeFromCart(
  userId: string,
  itemId: string,
): Promise<Cart> {
  if (!db) throw new Error("Firestore not initialized");
  
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  
  if (!cartSnap.exists()) {
    throw new Error("Cart not found");
  }
  
  const data = cartSnap.data();
  const cart: Cart = {
    id: cartSnap.id,
    userId: data.userId,
    items: data.items || [],
    total: data.total || 0,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
  
  cart.items = cart.items.filter((item) => item.id !== itemId);
  cart.total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  cart.updatedAt = new Date();
  
  await setDoc(cartRef, {
    ...cart,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  });
  
  return cart;
}

export async function updateCartQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<Cart> {
  if (!db) throw new Error("Firestore not initialized");
  
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  
  if (!cartSnap.exists()) {
    throw new Error("Cart not found");
  }
  
  const data = cartSnap.data();
  const cart: Cart = {
    id: cartSnap.id,
    userId: data.userId,
    items: data.items || [],
    total: data.total || 0,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
  
  const itemIndex = cart.items.findIndex((item) => item.id === itemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex]!.quantity = quantity;
    }
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.updatedAt = new Date();
  }
  
  await setDoc(cartRef, {
    ...cart,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  });
  
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    userId,
    items: [],
    total: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
