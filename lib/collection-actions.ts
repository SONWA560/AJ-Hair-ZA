"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export interface CollectionData {
  handle: string;
  title: string;
  description: string;
  hairTypes: string[];
  image: string;
}

const DEFAULT_COLLECTIONS: CollectionData[] = [
  {
    handle: "straight-hair",
    title: "Straight Hair",
    description: "Sleek and straight human hair wigs",
    hairTypes: ["straight"],
    image: "/images/straight-hair.jpg",
  },
  {
    handle: "curly-wavy",
    title: "Curly & Wavy",
    description: "Beautiful curly and wavy wigs",
    hairTypes: ["wavy", "body_wave", "deep_wave", "water_wave"],
    image: "/images/curly-wavy.jpeg",
  },
  {
    handle: "kinky-coily",
    title: "Kinky & Coily",
    description: "Natural kinky curly and coily wigs",
    hairTypes: ["kinky_curly", "coily"],
    image: "/images/kinky-coily.jpg",
  },
  {
    handle: "new-arrivals",
    title: "New Arrivals",
    description: "Latest wig collections",
    hairTypes: [],
    image: "/images/new-arrivals.jpeg",
  },
];

async function requireOrg() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
}

export async function getAdminCollections(): Promise<
  (CollectionData & { id: string })[]
> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("collections")
    .orderBy("createdAt", "asc")
    .get()
    .catch(() => null);

  if (!snapshot || snapshot.empty) {
    // Seed the default collections
    for (const col of DEFAULT_COLLECTIONS) {
      await db.collection("collections").doc(col.handle).set({
        ...col,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return DEFAULT_COLLECTIONS.map((c) => ({ ...c, id: c.handle }));
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      handle: data.handle ?? doc.id,
      title: data.title ?? "",
      description: data.description ?? "",
      hairTypes: data.hairTypes ?? [],
      image: data.image ?? "",
    };
  });
}

export async function createCollection(data: CollectionData) {
  await requireOrg();
  const db = getAdminDb();

  const handle =
    data.handle ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  await db
    .collection("collections")
    .doc(handle)
    .set({
      handle,
      title: data.title,
      description: data.description,
      hairTypes: data.hairTypes,
      image: data.image,
      path: `/search/${handle}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/admin/collections");
  revalidatePath("/");
  return { success: true, id: handle };
}

export async function updateCollection(id: string, data: CollectionData) {
  await requireOrg();
  const db = getAdminDb();

  await db.collection("collections").doc(id).update({
    title: data.title,
    description: data.description,
    hairTypes: data.hairTypes,
    image: data.image,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/collections");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCollection(id: string) {
  await requireOrg();
  const db = getAdminDb();
  await db.collection("collections").doc(id).delete();
  revalidatePath("/admin/collections");
  revalidatePath("/");
  return { success: true };
}
