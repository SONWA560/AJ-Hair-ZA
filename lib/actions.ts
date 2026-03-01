"use server";

import { sendOrderConfirmationEmail } from "@/lib/email";
import { getAdminDb } from "@/lib/firebase/admin";
import { getProducts } from "@/lib/firebase/firestore";
import { ProductFilters } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";

const collectionHairTypeMap: Record<string, string[]> = {
  "straight-hair": ["straight"],
  "curly-wavy": ["wavy", "body_wave", "deep_wave", "water_wave"],
  "kinky-coily": ["kinky_curly", "coily"],
  "new-arrivals": [],
};

export async function filterProducts(
  collection: string,
  filters: ProductFilters,
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

function sanitizeString(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[^\x00-\x7F]/g, " ") // Replace all non-ASCII with space
    .replace(/["'\\\n\r\t]/g, " ") // Also replace quotes, backslashes, newlines, tabs
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

export async function placeOrder(orderData: {
  items: Array<{
    id: string;
    productId?: string;
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
    const db = getAdminDb();

    console.log("Placing order...", { itemsCount: orderData.items?.length });

    // Sanitize items - ensure no undefined values
    const sanitizedItems = (orderData.items as any[])
      .map((item: any) => {
        const productId = sanitizeString(item.productId || item.id || "");
        return {
          productId: productId,
          title: sanitizeString(item.title || "Unknown Product"),
          price: Number(item.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          image: sanitizeString(item.image || ""),
          hairType: sanitizeString(item.variant?.hair_type || ""),
          length: sanitizeString(item.variant?.length || ""),
          color: sanitizeString(item.variant?.color || ""),
        };
      })
      .filter((item) => item.productId && item.productId !== "");

    // Stock validation — check availability before creating the order
    const outOfStockTitles: string[] = [];
    for (const item of sanitizedItems) {
      const productDoc = await db
        .collection("products")
        .doc(item.productId)
        .get();
      if (!productDoc.exists) continue;
      const inv = productDoc.data()?.inventory;
      if (!inv?.inStock || (inv?.quantity ?? 0) < item.quantity) {
        outOfStockTitles.push(item.title);
      }
    }
    if (outOfStockTitles.length > 0) {
      return {
        success: false,
        error: `The following item(s) are no longer available: ${outOfStockTitles.join(", ")}. Please update your cart.`,
      };
    }

    const order = {
      userId: userId || "guest",
      customerName:
        `${sanitizeString(orderData.shippingDetails.firstName)} ${sanitizeString(orderData.shippingDetails.lastName)}`.trim() ||
        "Customer",
      customerEmail:
        sanitizeString(orderData.shippingDetails.email) ||
        "noemail@example.com",
      customerPhone: sanitizeString(orderData.shippingDetails.phone || ""),
      shippingAddress: {
        street: sanitizeString(orderData.shippingDetails.address || ""),
        suburb: sanitizeString(orderData.shippingDetails.suburb || ""),
        city: sanitizeString(orderData.shippingDetails.city || ""),
        province: sanitizeString(orderData.shippingDetails.province || ""),
        postalCode: sanitizeString(orderData.shippingDetails.postalCode || ""),
      },
      items: sanitizedItems,
      subtotal: Number(orderData.subtotal) || 0,
      tax: Number(orderData.tax) || 0,
      shipping: Number(orderData.shipping) || 0,
      total: Number(orderData.total) || 0,
      paymentMethod: String(orderData.paymentMethod || "card"),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("orders").add(order);
    console.log("Order created:", docRef.id);

    // Send confirmation email (non-blocking — failure won't affect the order)
    await sendOrderConfirmationEmail({
      orderId: docRef.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      items: sanitizedItems,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
    });

    // Decrease inventory for each product - use sanitizedItems
    for (const item of sanitizedItems) {
      if (!item.productId) continue;

      try {
        const productRef = db.collection("products").doc(item.productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
          console.warn(
            `Product ${item.productId} not found, skipping inventory update`,
          );
          continue;
        }

        const productData = productDoc.data();
        const currentQuantity = productData?.inventory?.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - item.quantity);
        const newInStock = newQuantity > 0;

        await productRef.update({
          "inventory.quantity": newQuantity,
          "inventory.inStock": newInStock,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(
          `Inventory updated: ${item.productId} (${currentQuantity} -> ${newQuantity})`,
        );
      } catch (inventoryError) {
        console.error(
          `Failed to update inventory for ${item.productId}:`,
          inventoryError,
        );
      }
    }

    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Order failed:", error);
    return { success: false, error: "Failed to place order" };
  }
}

export async function completeOrder(orderId: string) {
  try {
    const db = getAdminDb();

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    // Update order status to completed — inventory was already decreased at purchase time
    await db.collection("orders").doc(orderId).update({
      status: "completed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Error completing order:", error);
    return { success: false, error: "Failed to complete order" };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled",
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const db = getAdminDb();
    await db.collection("orders").doc(orderId).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}
