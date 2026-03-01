import { Cart, CartItem, Product, ProductFilters } from "../types";
import { getAdminDb } from "./admin";

// Helper function to convert Firestore data to serializable plain objects
function convertFirestoreData(data: any): any {
  if (!data) return data;

  const converted = { ...data };

  // Convert Timestamp objects to plain dates
  if (data.timestamps) {
    converted.timestamps = {
      createdAt: data.timestamps.createdAt?.toDate(),
      updatedAt: data.timestamps.updatedAt?.toDate(),
    };
  }

  // Handle any other Timestamp fields
  Object.keys(converted).forEach((key) => {
    if (converted[key] && typeof converted[key].toDate === "function") {
      converted[key] = converted[key].toDate();
    }
  });

  return converted;
}

// Collection names
export const COLLECTIONS = {
  PRODUCTS: "products",
  CARTS: "carts",
  ORDERS: "orders",
  USERS: "users",
  ADMIN_PROFILES: "adminProfiles",
  INVENTORY: "inventory",
  SEARCH_LOGS: "searchLogs",
  ANALYTICS: "analytics",
} as const;

// Product operations
export async function getProducts(
  filters?: ProductFilters,
): Promise<Product[]> {
  const db = getAdminDb();
  let query: any = db.collection(COLLECTIONS.PRODUCTS);

  // Apply filters if provided
  if (filters?.hair_type) {
    if (Array.isArray(filters.hair_type)) {
      // Use in memory filter for multiple values (requires composite index otherwise)
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
  if (filters?.occasion) {
    query = query.where(
      "metadata.occasion",
      "array-contains",
      filters.occasion,
    );
  }
  if (filters?.inStock !== undefined) {
    query = query.where("inventory.inStock", "==", filters.inStock);
  }

  // Order by trending score and creation date
  query = query
    .orderBy("metadata.trending_score", "desc")
    .orderBy("timestamps.createdAt", "desc");

  try {
    const snapshot = await query.get();
    const results = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return convertFirestoreData({
        id: doc.id,
        ...data,
      }) as Product;
    });
    // Strict query returned nothing — retry with fuzzy in-memory matching
    if (results.length === 0 && filters && Object.keys(filters).length > 0) {
      return getFilteredProducts(filters);
    }
    return results;
  } catch (error) {
    console.error("Error fetching products:", error);
    if (filters) {
      return getFilteredProducts(filters);
    }
    return [];
  }
}

// Advanced filtering with multiple filter values (uses in-memory filtering)
async function getFilteredProducts(filters: ProductFilters): Promise<Product[]> {
  const db = getAdminDb();
  let query: any = db.collection(COLLECTIONS.PRODUCTS);

  // Only apply boolean inStock filter at query level — string filters use in-memory fuzzy matching
  if (filters?.inStock !== undefined) {
    query = query.where("inventory.inStock", "==", filters.inStock);
  }

  // Order by trending score
  query = query.orderBy("metadata.trending_score", "desc");

  try {
    let snapshot;
    try {
      snapshot = await query.get();
    } catch (indexError: any) {
      // Fallback: get all products if index doesn't exist
      console.warn("Index not found, fetching all products:", indexError.message);
      snapshot = await db.collection(COLLECTIONS.PRODUCTS).limit(200).get();
    }

    let products = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return convertFirestoreData({
        id: doc.id,
        ...data,
      }) as Product;
    });

    // Helper function to normalize length for comparison (e.g., "8in", "8inch", "8"", "8" all should match)
    function normalizeLength(value: string): string {
      if (!value) return "";
      return value.toLowerCase().replace(/["'\s]/g, "").replace(/inch/g, "").replace(/in$/g, "");
    }

    // Apply in-memory filters — handles both single-value and array values with fuzzy matching
    if (filters?.hair_type) {
      if (Array.isArray(filters.hair_type) && filters.hair_type.length > 0) {
        products = products.filter((p: Product) =>
          filters.hair_type!.includes(p.specifications?.hair_type)
        );
      } else if (typeof filters.hair_type === "string") {
        products = products.filter((p: Product) =>
          p.specifications?.hair_type === filters.hair_type
        );
      }
    }

    if (filters?.length) {
      if (Array.isArray(filters.length) && filters.length.length > 0) {
        products = products.filter((p: Product) => {
          const productLength = normalizeLength(p.specifications?.length || "");
          return (filters.length as string[]).some((f) => normalizeLength(f) === productLength);
        });
      } else if (typeof filters.length === "string") {
        products = products.filter((p: Product) =>
          normalizeLength(p.specifications?.length || "") === normalizeLength(filters.length as string)
        );
      }
    }

    if (filters?.color) {
      // Word-level matching: "Jet Black" matches "Natural Black" because both contain "black"
      function colorMatches(productColor: string, filterColor: string): boolean {
        const pWords = productColor.toLowerCase().split(/\s+/).filter(Boolean);
        const fWords = filterColor.toLowerCase().split(/\s+/).filter(Boolean);
        return fWords.some((fw) => pWords.some((pw) => pw.includes(fw) || fw.includes(pw)));
      }

      if (Array.isArray(filters.color) && filters.color.length > 0) {
        products = products.filter((p: Product) =>
          (filters.color as string[]).some((c) =>
            colorMatches(p.specifications?.color || "", c)
          )
        );
      } else if (typeof filters.color === "string") {
        const filterColor = filters.color;
        products = products.filter((p: Product) =>
          colorMatches(p.specifications?.color || "", filterColor)
        );
      }
    }

    if (filters?.density) {
      if (Array.isArray(filters.density) && filters.density.length > 0) {
        products = products.filter((p: Product) =>
          (filters.density as string[]).includes(p.specifications?.density)
        );
      } else if (typeof filters.density === "string") {
        products = products.filter((p: Product) =>
          p.specifications?.density === filters.density
        );
      }
    }

    const filterLaceTypes = Array.isArray(filters?.lace_type) ? filters.lace_type : [];
    if (filterLaceTypes.length > 0) {
      products = products.filter((p: Product) => 
        filterLaceTypes.some((l) => 
          p.specifications?.lace_type?.toLowerCase().includes(l.toLowerCase()) ||
          l.toLowerCase().includes(p.specifications?.lace_type?.toLowerCase() || "")
        )
      );
    }

    // Apply price range filter
    if (filters?.price_min !== undefined) {
      products = products.filter((p: Product) => p.price >= filters.price_min!);
    }
    if (filters?.price_max !== undefined) {
      products = products.filter((p: Product) => p.price <= filters.price_max!);
    }

    // Apply search query
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter((p: Product) => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "price_low_high":
          products.sort((a: Product, b: Product) => a.price - b.price);
          break;
        case "price_high_low":
          products.sort((a: Product, b: Product) => b.price - a.price);
          break;
        case "newest":
          products.sort((a: Product, b: Product) => 
            new Date(b.timestamps.createdAt).getTime() - new Date(a.timestamps.createdAt).getTime()
          );
          break;
        case "best_selling":
          products.sort((a: Product, b: Product) => 
            (b.metadata?.trending_score || 0) - (a.metadata?.trending_score || 0)
          );
          break;
      }
    }

    return products;
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  try {
    const db = getAdminDb();
    
    // First try with the inStock filter (requires composite index)
    let snapshot;
    try {
      snapshot = await db
        .collection(COLLECTIONS.PRODUCTS)
        .where("seo.handle", "==", handle)
        .where("inventory.inStock", "==", true)
        .orderBy("metadata.trending_score", "desc")
        .limit(1)
        .get();
    } catch (indexError) {
      // If index doesn't exist, try simpler query
      snapshot = await db
        .collection(COLLECTIONS.PRODUCTS)
        .where("seo.handle", "==", handle)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      // Try fetching without inStock filter
      snapshot = await db
        .collection(COLLECTIONS.PRODUCTS)
        .where("seo.handle", "==", handle)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      console.log(`getProduct: No product found for handle: ${handle}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc?.data();
    const product = convertFirestoreData({
      id: doc?.id,
      ...data,
    }) as Product;

    console.log(
      `getProduct: Found product for handle "${handle}" - ID: ${product.id}`,
    );
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return convertFirestoreData({
      id: doc.id,
      ...data,
    }) as Product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const db = getAdminDb();
    const lowerQuery = query.toLowerCase();

    // Try array-contains-any search (may fail if no composite index exists)
    let snapshot;
    try {
      snapshot = await db
        .collection(COLLECTIONS.PRODUCTS)
        .where("metadata.search_tags", "array-contains-any", [lowerQuery])
        .limit(50)
        .get();
    } catch (indexError: any) {
      console.warn(
        "Search index not found, using fallback:",
        indexError.message,
      );
      snapshot = null;
    }

    if (snapshot && !snapshot.empty) {
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertFirestoreData({ id: doc.id, ...data }) as Product;
      });
    }

    // Fallback: Get all products and filter in memory (works without indexes)
    const allSnapshot = await db
      .collection(COLLECTIONS.PRODUCTS)
      .limit(100)
      .get();

    const products = allSnapshot.docs.map((doc) => {
      const data = doc.data();
      return convertFirestoreData({ id: doc.id, ...data }) as Product;
    });

    // Filter by title/description match in memory
    const searchTerms = lowerQuery.split(" ").filter(Boolean);
    return products.filter((product) => {
      const title = (product.title || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const tags = (product as any).metadata?.search_tags || [];
      return searchTerms.every(
        (term) =>
          title.includes(term) ||
          description.includes(term) ||
          tags.some((tag: string) => tag.includes(term)),
      );
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

// Cart operations
export async function getCart(userId: string): Promise<Cart | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTIONS.CARTS).doc(userId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return convertFirestoreData({
      id: doc.id,
      ...data,
    }) as Cart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  try {
    const cartRef = getAdminDb().collection(COLLECTIONS.CARTS).doc(userId);
    const cartDoc = await cartRef.get();

    let cart: Cart;
    if (cartDoc.exists) {
      cart = { id: cartDoc.id, ...cartDoc.data() } as Cart;
    } else {
      // Create new cart
      cart = {
        id: userId,
        userId,
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex]!.quantity += quantity;
    } else {
      // Add new item
      const product = await getProductById(productId);
      if (product) {
        const newItem: CartItem = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          title: product.title,
          price: product.price,
          quantity,
          image: product.images[0]?.url || "",
          variant: {
            hair_type: product.specifications.hair_type,
            length: product.specifications.length,
            color: product.specifications.color,
          },
        };
        cart.items.push(newItem);
      }
    }

    // Calculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    cart.updatedAt = new Date();

    await cartRef.set(cart);
    return cart;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function removeFromCart(
  userId: string,
  itemId: string,
): Promise<Cart> {
  try {
    const cartRef = getAdminDb().collection(COLLECTIONS.CARTS).doc(userId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      throw new Error("Cart not found");
    }

    const cart = { id: cartDoc.id, ...cartDoc.data() } as Cart;
    cart.items = cart.items.filter((item) => item.id !== itemId);
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    cart.updatedAt = new Date();

    await cartRef.set(cart);
    return cart;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function updateCartQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<Cart> {
  try {
    const cartRef = getAdminDb().collection(COLLECTIONS.CARTS).doc(userId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      throw new Error("Cart not found");
    }

    const cart = { id: cartDoc.id, ...cartDoc.data() } as Cart;
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex >= 0) {
      cart.items[itemIndex]!.quantity = quantity;
      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      cart.updatedAt = new Date();
    }

    await cartRef.set(cart);
    return cart;
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    throw error;
  }
}

// Analytics operations
export async function logSearchQuery(
  query: string,
  userId?: string,
  filters?: any,
) {
  try {
    const db = getAdminDb();
    await db.collection(COLLECTIONS.SEARCH_LOGS).add({
      query,
      ...(userId !== undefined ? { userId } : {}),
      filters,
      timestamp: new Date(),
      location: "Johannesburg",
    });
  } catch (error) {
    console.error("Error logging search query:", error);
  }
}

// Utility functions
export async function getTrendingProducts(
  limit: number = 8,
): Promise<Product[]> {
  try {
    const db = getAdminDb();

    let snapshot;
    try {
      snapshot = await db
        .collection(COLLECTIONS.PRODUCTS)
        .where("inventory.inStock", "==", true)
        .orderBy("metadata.trending_score", "desc")
        .limit(limit)
        .get();
    } catch (indexError: any) {
      console.warn(
        "Trending products index not found, using fallback:",
        indexError.message,
      );
      snapshot = null;
    }

    if (snapshot && !snapshot.empty) {
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return convertFirestoreData({
          id: doc.id,
          ...data,
        }) as Product;
      });
    }

    // Fallback: Get products and sort in memory
    const allSnapshot = await db
      .collection(COLLECTIONS.PRODUCTS)
      .limit(100)
      .get();

    const products = allSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return convertFirestoreData({
        id: doc.id,
        ...data,
      }) as Product;
    });

    // Sort by trending_score in memory
    return products
      .filter((p) => (p as any).inventory?.inStock)
      .sort((a, b) => {
        const scoreA = (a as any).metadata?.trending_score || 0;
        const scoreB = (b as any).metadata?.trending_score || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

export async function getProductsByHairType(
  collectionHandle: string,
): Promise<Product[]> {
  try {
    // Map collection handles to filter criteria - support arrays
    const handleToFilters: Record<
      string,
      { hair_type?: string | string[] }
    > = {
      "straight-hair": { hair_type: "straight" },
      "curly-wavy": { hair_type: ["wavy", "body_wave", "deep_wave", "water_wave"] },
      "kinky-coily": { hair_type: ["kinky_curly", "coily"] },
      "new-arrivals": {},
    };

    const filters = handleToFilters[collectionHandle];

    // If no filter defined for this collection, return empty
    if (!filters) {
      return [];
    }

    // Get products with the filter
    const products = await getProducts(filters);

    return products.slice(0, 50);
  } catch (error) {
    console.error("Error fetching products by hair type:", error);
    return [];
  }
}

// Order operations for admin and customers
export async function getAdminOrders(status?: string) {
  try {
    const db = getAdminDb();
    let query: any = db.collection("orders").orderBy("createdAt", "desc");
    if (status) {
      query = db
        .collection("orders")
        .where("status", "==", status)
        .orderBy("createdAt", "desc");
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertFirestoreData(doc.data()),
    }));
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    // Fallback without ordering
    try {
      const db = getAdminDb();
      const snapshot = status
        ? await db.collection("orders").where("status", "==", status).get()
        : await db.collection("orders").get();
      const docs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...convertFirestoreData(doc.data()),
      }));
      return docs.sort((a: any, b: any) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch {
      return [];
    }
  }
}

export async function getAdminOrderById(orderId: string) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...convertFirestoreData(doc.data()!) };
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function getOrdersByUserId(userId: string) {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertFirestoreData(doc.data()),
    }));
  } catch (error) {
    // Fallback without index
    try {
      const db = getAdminDb();
      const snapshot = await db
        .collection("orders")
        .where("userId", "==", userId)
        .get();
      const docs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...convertFirestoreData(doc.data()),
      }));
      return docs.sort((a: any, b: any) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch {
      return [];
    }
  }
}

export async function getReportData() {
  try {
    const db = getAdminDb();
    const [ordersSnap, productsSnap] = await Promise.all([
      db.collection("orders").get(),
      db.collection("products").get(),
    ]);

    const orders = ordersSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...convertFirestoreData(doc.data()),
    }));

    const products = productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...convertFirestoreData(doc.data()),
    }));

    return { orders, products };
  } catch (error) {
    console.error("Error fetching report data:", error);
    return { orders: [], products: [] };
  }
}
