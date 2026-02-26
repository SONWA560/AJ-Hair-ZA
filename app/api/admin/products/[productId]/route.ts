import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

interface ProductFormData {
  productId: string;
  title: string;
  description: string;
  price: string;
  hair_type: string;
  lace_type: string;
  density: string;
  length: string;
  color: string;
  inStock: boolean;
  quantity: string;
  imageUrl: string;
  handle: string;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const productId = params.productId;
    console.log("API: Updating product with ID:", productId);
    
    const body: ProductFormData = await request.json();
    console.log("API: Body:", body);

    const { 
      title, 
      description, 
      price, 
      hair_type, 
      lace_type, 
      density, 
      length, 
      color, 
      inStock, 
      quantity, 
      imageUrl,
      handle 
    } = body;

    if (!title || !price || !handle) {
      return NextResponse.json(
        { error: "Title, price, and handle are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // First get the existing product to preserve createdAt
    const existingDoc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
    const existingData = existingDoc.data();
    const originalCreatedAt = existingData?.timestamps?.createdAt;

    const productData = {
      title,
      description: description || "",
      description_for_ai: description || "",
      price: parseFloat(price),
      currency: "ZAR",
      images: imageUrl ? [{
        url: imageUrl,
        alt: title,
        width: 800,
        height: 800,
      }] : [],
      specifications: {
        hair_type,
        lace_type,
        density,
        length,
        color,
        texture: hair_type,
      },
      options: [
        { id: "hair-type", name: "Hair Type", values: [hair_type] },
        { id: "length", name: "Length", values: [length] },
        { id: "color", name: "Color", values: [color] },
      ],
      metadata: {
        occasion: ["daily"],
        trending_score: 5,
        search_tags: [
          hair_type,
          lace_type,
          density,
          length,
          color,
          title.toLowerCase(),
        ].filter(Boolean),
        suitable_face_shapes: [],
        maintenance_level: "medium",
        featured: false,
        new_arrival: true,
      },
      inventory: {
        inStock,
        quantity: parseInt(quantity) || 0,
        reserved: 0,
      },
      seo: {
        title: title,
        description: description || "",
        handle,
        keywords: [hair_type, lace_type, density, length, color].filter(Boolean),
      },
      timestamps: {
        createdAt: originalCreatedAt || new Date(),
        updatedAt: new Date(),
      },
    };

    console.log("API: Updating Firestore document:", productId);
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update(productData);
    console.log("API: Update successful");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const productId = params.productId;

    const db = getAdminDb();
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
