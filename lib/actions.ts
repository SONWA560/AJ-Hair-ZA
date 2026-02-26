"use server";

import { getProducts } from "@/lib/firebase/firestore";
import { ProductFilters } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getClientFirestore() {
  if (typeof window !== "undefined") return null;
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getFirestore();
}

const collectionHairTypeMap: Record<string, string[]> = {
  "straight-hair": ["straight"],
  "curly-wavy": ["wavy", "body_wave", "deep_wave", "water_wave"],
  "kinky-coily": ["kinky_curly", "coily"],
  "new-arrivals": [],
};

export async function filterProducts(
  collection: string,
  filters: ProductFilters
): Promise<{ products: any[]; total: number }> {
  try {
    const hairTypes = collectionHairTypeMap[collection] || [];
    
    // Build filter object
    const filterObj: ProductFilters = { ...filters };
    
    // ALWAYS apply collection filter - user selection doesn't override collection
    if (hairTypes.length > 0) {
      filterObj.hair_type = hairTypes;
    }

    // If new-arrivals, get all products sorted by newest
    if (collection === "new-arrivals") {
      filterObj.sortBy = "newest";
    }

    const products = await getProducts(filterObj);

    return {
      products,
      total: products.length,
    };
  } catch (error) {
    console.error("Error filtering products:", error);
    return { products: [], total: 0 };
  }
}

export async function placeOrder(orderData: {
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    variant?: {
      hair_type?: string;
      length?: string;
      color?: string;
    };
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    suburb?: string;
    city: string;
    province?: string;
    postalCode: string;
  };
  paymentMethod: string;
}) {
  try {
    const { userId } = await auth();
    const db = getClientFirestore();
    
    if (!db) {
      throw new Error("Failed to initialize Firestore");
    }

    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    
    const order = {
      userId: userId || null,
      customerName: `${orderData.shippingDetails.firstName} ${orderData.shippingDetails.lastName}`,
      customerEmail: orderData.shippingDetails.email,
      customerPhone: orderData.shippingDetails.phone,
      shippingAddress: {
        street: orderData.shippingDetails.address,
        suburb: orderData.shippingDetails.suburb,
        city: orderData.shippingDetails.city,
        province: orderData.shippingDetails.province,
        postalCode: orderData.shippingDetails.postalCode,
      },
      items: orderData.items.map((item) => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        hairType: item.variant?.hair_type,
        length: item.variant?.length,
        color: item.variant?.color,
      })),
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      shipping: orderData.shipping,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      status: "pending", // Will be completed after payment simulation
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "orders"), order);
    console.log("Order created with ID:", docRef.id);
    
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error placing order:", error);
    return { success: false, error: "Failed to place order" };
  }
}

export async function completeOrder(orderId: string) {
  try {
    const db = getClientFirestore();
    
    if (!db) {
      throw new Error("Failed to initialize Firestore");
    }

    const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    
    await updateDoc(doc(db, "orders", orderId), {
      status: "completed",
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error completing order:", error);
    return { success: false, error: "Failed to complete order" };
  }
}
