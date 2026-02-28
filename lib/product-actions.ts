"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

async function requireOrg() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
}

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  cost: number;
  imageUrls: string[];
  // Specifications
  hair_type: string;
  lace_type: string;
  density: string;
  hair_grade: string;
  length: string;
  color: string;
  texture: string;
  // Inventory
  quantity: number;
  inStock: boolean;
  // Metadata
  featured: boolean;
  new_arrival: boolean;
  trending_score: number;
  // SEO
  seo_handle: string;
  seo_title: string;
  seo_description: string;
}

function toHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAdminProducts() {
  const db = getAdminDb();
  const snapshot = await db
    .collection("products")
    .orderBy("timestamps.createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title ?? "",
      price: data.price ?? 0,
      hairType: data.specifications?.hair_type ?? "",
      inStock: data.inventory?.inStock ?? false,
      quantity: data.inventory?.quantity ?? 0,
      image: data.images?.[0]?.url ?? "",
      handle: data.seo?.handle ?? "",
    };
  });
}

export async function createProduct(data: ProductFormData) {
  await requireOrg();
  const db = getAdminDb();

  const handle = data.seo_handle || toHandle(data.title);

  const product = {
    title: data.title,
    description: data.description,
    description_for_ai: data.description,
    price: Number(data.price),
    cost: Number(data.cost) || 0,
    currency: "ZAR",
    images: data.imageUrls
      .filter(Boolean)
      .map((url) => ({ url, alt: data.title, width: 800, height: 800 })),
    specifications: {
      hair_type: data.hair_type,
      lace_type: data.lace_type,
      density: data.density,
      hair_grade: data.hair_grade,
      length: data.length,
      color: data.color,
      texture: data.texture,
    },
    options: [],
    variants: [],
    metadata: {
      occasion: [],
      trending_score: Number(data.trending_score) || 0,
      views: 0,
      search_tags: [data.hair_type, data.color, data.length].filter(Boolean),
      suitable_face_shapes: [],
      maintenance_level: "medium",
      featured: data.featured,
      new_arrival: data.new_arrival,
    },
    inventory: {
      inStock: data.inStock,
      quantity: Number(data.quantity) || 0,
      reserved: 0,
    },
    seo: {
      title: data.seo_title || data.title,
      description: data.seo_description || data.description,
      handle,
      keywords: [data.hair_type, data.color, data.length].filter(Boolean),
    },
    ratings: { average: 0, count: 0 },
    timestamps: {
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  };

  const docRef = await db.collection("products").add(product);
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true, id: docRef.id };
}

export async function updateProduct(id: string, data: ProductFormData) {
  await requireOrg();
  const db = getAdminDb();
  const handle = data.seo_handle || toHandle(data.title);

  await db
    .collection("products")
    .doc(id)
    .update({
      title: data.title,
      description: data.description,
      description_for_ai: data.description,
      price: Number(data.price),
      cost: Number(data.cost) || 0,
      images: data.imageUrls
        .filter(Boolean)
        .map((url) => ({ url, alt: data.title, width: 800, height: 800 })),
      specifications: {
        hair_type: data.hair_type,
        lace_type: data.lace_type,
        density: data.density,
        hair_grade: data.hair_grade,
        length: data.length,
        color: data.color,
        texture: data.texture,
      },
      "metadata.trending_score": Number(data.trending_score) || 0,
      "metadata.featured": data.featured,
      "metadata.new_arrival": data.new_arrival,
      "metadata.search_tags": [data.hair_type, data.color, data.length].filter(
        Boolean,
      ),
      "inventory.inStock": data.inStock,
      "inventory.quantity": Number(data.quantity) || 0,
      "seo.title": data.seo_title || data.title,
      "seo.description": data.seo_description || data.description,
      "seo.handle": handle,
      "seo.keywords": [data.hair_type, data.color, data.length].filter(Boolean),
      "timestamps.updatedAt": FieldValue.serverTimestamp(),
    });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireOrg();
  const db = getAdminDb();
  await db.collection("products").doc(id).delete();
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function getProductForEdit(id: string) {
  const db = getAdminDb();
  const doc = await db.collection("products").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title ?? "",
    description: data.description ?? "",
    price: data.price ?? 0,
    cost: data.cost ?? 0,
    imageUrls: (data.images ?? []).map((img: any) => img.url),
    hair_type: data.specifications?.hair_type ?? "",
    lace_type: data.specifications?.lace_type ?? "",
    density: data.specifications?.density ?? "",
    hair_grade: data.specifications?.hair_grade ?? "",
    length: data.specifications?.length ?? "",
    color: data.specifications?.color ?? "",
    texture: data.specifications?.texture ?? "",
    quantity: data.inventory?.quantity ?? 0,
    inStock: data.inventory?.inStock ?? false,
    featured: data.metadata?.featured ?? false,
    new_arrival: data.metadata?.new_arrival ?? false,
    trending_score: data.metadata?.trending_score ?? 0,
    seo_handle: data.seo?.handle ?? "",
    seo_title: data.seo?.title ?? "",
    seo_description: data.seo?.description ?? "",
  };
}
