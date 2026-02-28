"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { Product } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";

const WISHLISTS = "wishlists";
const PRODUCTS = "products";

export async function toggleWishlist(
  productId: string,
): Promise<{ isInWishlist: boolean }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const db = getAdminDb();
  const ref = db.collection(WISHLISTS).doc(userId);
  const doc = await ref.get();

  const items: string[] = doc.exists
    ? ((doc.data()?.items as string[]) ?? [])
    : [];

  const already = items.includes(productId);

  if (already) {
    await ref.set({ items: FieldValue.arrayRemove(productId) }, { merge: true });
    return { isInWishlist: false };
  } else {
    await ref.set({ items: FieldValue.arrayUnion(productId) }, { merge: true });
    return { isInWishlist: true };
  }
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const db = getAdminDb();
  const doc = await db.collection(WISHLISTS).doc(userId).get();
  if (!doc.exists) return [];
  return (doc.data()?.items as string[]) ?? [];
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const ids = await getWishlistProductIds(userId);
  if (ids.length === 0) return [];

  const db = getAdminDb();
  const docs = await Promise.all(
    ids.map((id) => db.collection(PRODUCTS).doc(id).get()),
  );

  return docs
    .filter((d) => d.exists)
    .map((d) => ({ id: d.id, ...d.data() } as Product));
}
