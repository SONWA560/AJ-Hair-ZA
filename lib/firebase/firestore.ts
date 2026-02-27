import { Product, ProductFilters, Cart, CartItem } from "../types";

let _db: any = null;
let _adminInitialized = false;

async function getAdminDb() {
  if (_db) return _db;
  
  if (!_adminInitialized) {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
    _adminInitialized = true;
    _db = admin.firestore();
  }
  
  return _db;
}

const COLLECTIONS = {
  PRODUCTS: "products",
  CARTS: "carts",
  ORDERS: "orders",
  USERS: "users",
  ADMIN_PROFILES: "adminProfiles",
  INVENTORY: "inventory",
  SEARCH_LOGS: "searchLogs",
  ANALYTICS: "analytics",
} as const;

function convertFirestoreData(data: any): any {
  if (!data) return data;
  const converted = { ...data };
  if (data.timestamps) {
    converted.timestamps = {
      createdAt: data.timestamps.createdAt?.toDate(),
      updatedAt: data.timestamps.updatedAt?.toDate(),
    };
  }
  Object.keys(converted).forEach((key) => {
    if (converted[key] && typeof converted[key].toDate === "function") {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const db = await getAdminDb();
  let query: any = db.collection(COLLECTIONS.PRODUCTS);

  if (filters?.hair_type) {
    if (Array.isArray(filters.hair_type)) {
      return getFilteredProducts(filters);
    }
    query = query.where("specifications.hair_type", "==", filters.hair_type);
  }
  if (filters?.length) {
    query = query.where("specifications.length", "==", filters.length);
  }
  if (filters?.color) {
    query = query.where("specifications.color", "==", filters.color);
  }
  if (filters?.density) {
    query = query.where("specifications.density", "==", filters.density);
  }
  if (filters?.inStock !== undefined) {
    query = query.where("inventory.inStock", "==", filters.inStock);
  }

  try {
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return convertFirestoreData({
        id: doc.id,
        ...data,
      }) as Product;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getFilteredProducts(filters: ProductFilters): Promise<Product[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection(COLLECTIONS.PRODUCTS).limit(200).get();
  
  let products = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return convertFirestoreData({ id: doc.id, ...data }) as Product;
  });

  if (filters?.hair_type && Array.isArray(filters.hair_type)) {
    products = products.filter((p: any) => 
      filters.hair_type!.includes(p.specifications?.hair_type)
    );
  }
  if (filters?.length && Array.isArray(filters.length)) {
    products = products.filter((p: any) => 
      filters.length!.includes(p.specifications?.length)
    );
  }
  if (filters?.color && Array.isArray(filters.color)) {
    products = products.filter((p: any) => 
      filters.color!.includes(p.specifications?.color)
    );
  }
  if (filters?.density && Array.isArray(filters.density)) {
    products = products.filter((p: any) => 
      filters.density!.includes(p.specifications?.density)
    );
  }
  if (filters?.inStock !== undefined) {
    products = products.filter((p: any) => p.inventory?.inStock === filters.inStock);
  }

  return products;
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const db = await getAdminDb();
  try {
    const snapshot = await db
      .collection(COLLECTIONS.PRODUCTS)
      .where("seo.handle", "==", handle)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return convertFirestoreData({ id: doc.id, ...doc.data() }) as Product;
  } catch (error) {
    console.error("Error fetching product by handle:", error);
    return null;
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  const db = await getAdminDb();
  try {
    const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
    
    if (!doc.exists) return null;
    
    return convertFirestoreData({ id: doc.id, ...doc.data() }) as Product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

export async function getTrendingProducts(limit: number = 10): Promise<Product[]> {
  const db = await getAdminDb();
  try {
    const snapshot = await db
      .collection(COLLECTIONS.PRODUCTS)
      .where("inventory.inStock", "==", true)
      .limit(limit)
      .get();

    const products = snapshot.docs.map((doc: any) => 
      convertFirestoreData({ id: doc.id, ...doc.data() }) as Product
    );

    return products
      .filter((p: any) => p.inventory?.inStock)
      .sort((a: any, b: any) => {
        const scoreA = a.metadata?.trending_score || 0;
        const scoreB = b.metadata?.trending_score || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

export async function getProductsByHairType(collectionHandle: string): Promise<Product[]> {
  try {
    const handleToFilters: Record<string, { hair_type?: string | string[] }> = {
      "straight-hair": { hair_type: "straight" },
      "curly-wavy": { hair_type: ["wavy", "body_wave", "deep_wave", "water_wave"] },
      "kinky-coily": { hair_type: ["kinky_curly", "coily"] },
      "new-arrivals": {},
    };

    const filters = handleToFilters[collectionHandle];

    if (!filters) {
      return [];
    }

    const products = await getProducts(filters);
    return products.slice(0, 50);
  } catch (error) {
    console.error("Error fetching products by hair type:", error);
    return [];
  }
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const db = await getAdminDb();
  const docRef = await db.collection(COLLECTIONS.PRODUCTS).add({
    ...productData,
    timestamps: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return { id: docRef.id, ...productData } as Product;
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
  const db = await getAdminDb();
  await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
    ...productData,
    timestamps: {
      updatedAt: new Date(),
    },
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = await getAdminDb();
  await db.collection(COLLECTIONS.PRODUCTS).doc(productId).delete();
}

export async function getShopifyCart(cartId: string): Promise<any> {
  const db = await getAdminDb();
  const cartDoc = await db.collection(COLLECTIONS.CARTS).doc(cartId).get();
  
  if (!cartDoc.exists) {
    throw new Error(`Cart with ID "${cartId}" not found`);
  }

  const cartData = cartDoc.data();
  return {
    id: cartId,
    checkoutUrl: "/checkout",
    cost: {
      subtotalAmount: { amount: cartData?.total?.toFixed(2) || "0.00", currencyCode: "ZAR" },
      totalAmount: { amount: cartData?.total?.toFixed(2) || "0.00", currencyCode: "ZAR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "ZAR" },
    },
    lines: {
      edges: (cartData?.items || []).map((item: any) => ({
        node: {
          id: item.id,
          quantity: item.quantity,
          merchandise: {
            id: item.productId,
            title: item.title,
            price: { amount: item.price.toFixed(2), currencyCode: "ZAR" },
            image: item.image ? { url: item.image } : null,
            product: { handle: item.productId },
          },
        },
      })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
    totalQuantity: cartData?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
  };
}

export { COLLECTIONS };
