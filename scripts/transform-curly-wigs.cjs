require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const fs = require("fs");
const path = require("path");

const inputFile = path.join(process.cwd(), "curly_wigs_raw_dataset.json");
const PRODUCTS_COLLECTION = "products";

// Helper functions
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractHairType(title) {
  const t = title.toLowerCase();
  if (t.includes("water wave")) return "water_wave";
  if (t.includes("deep curl") || t.includes("deep wave")) return "deep_wave";
  if (t.includes("kinky curl") || t.includes("kinky straight")) return "kinky_curly";
  if (t.includes("wavy") || t.includes("wave")) return "wavy";
  if (t.includes("curly") || t.includes("curl")) return "kinky_curly";
  if (t.includes("bob")) return "straight";
  return "wavy"; // default for curly wigs collection
}

function extractLength(title) {
  const match = title.match(/(\d+)\s*["inchin]*/i);
  if (match) {
    return match[1] + "in";
  }
  return "16in";
}

function extractLaceType(title) {
  const t = title.toLowerCase();
  if (t.includes("9x6") || t.includes("9*6")) return "9x6";
  if (t.includes("13x4") || t.includes("13*4")) return "13x4";
  if (t.includes("13x6") || t.includes("13*6")) return "13x6";
  if (t.includes("6x5") || t.includes("6*5")) return "6x5";
  if (t.includes("5x5") || t.includes("5*5")) return "5x5";
  if (t.includes("4x4") || t.includes("4*4")) return "4x4";
  if (t.includes("360")) return "360 Lace";
  return "5x5"; // default
}

function extractColor(title) {
  const t = title.toLowerCase();
  if (t.includes("balayage")) return "Balayage";
  if (t.includes("ombre") || t.includes("ombré")) return "Ombré";
  if (t.includes("1b") || t.includes("natural black")) return "Natural Black";
  if (t.includes("4/30") || t.includes("613")) return "Blonde";
  if (t.includes("27") || t.includes("honey")) return "Honey Blonde";
  if (t.includes("30") || t.includes("chestnut")) return "Chestnut";
  if (t.includes("burgundy") || t.includes("99j")) return "Burgundy";
  if (t.includes("jet black") || t.includes("1")) return "Jet Black";
  return "Natural Black"; // default
}

function generateSeoHandle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
}

function transformToFirestoreProduct(product, index) {
  const title = product.title || "Untitled Product";
  const hairType = extractHairType(title);
  const length = extractLength(title);
  const laceType = extractLaceType(title);
  const color = extractColor(title);

  // Get first image as main
  const mainImage = product.medias?.[0];
  const allImages = (product.medias || []).slice(0, 6).map((m, i) => ({
    url: m.url,
    alt: title + (i > 0 ? ` - Image ${i + 1}` : ""),
    width: 800,
    height: 1200,
  }));

  // Get price in ZAR (from cents)
  const priceInCents = product.variants?.[0]?.price?.current || 0;
  const price = Math.round(priceInCents / 100);

  // Get stock status
  const stockStatus = product.variants?.[0]?.price?.stockStatus || "InStock";
  const inStock = stockStatus === "InStock";

  // Parse dates from source
  const createdAt = product.source?.createdUTC
    ? new Date(product.source.createdUTC)
    : new Date();
  const updatedAt = product.source?.updatedUTC
    ? new Date(product.source.updatedUTC)
    : new Date();

  return {
    id: product.source?.id?.toString() || `curly-${index}`,
    title: title,
    description: stripHtml(product.description || "").substring(0, 1000),
    description_for_ai: stripHtml(product.description || "").substring(0, 500),
    price: price,
    currency: "ZAR",
    images: allImages,
    specifications: {
      hair_type: hairType,
      lace_type: laceType,
      density: "180%",
      hair_grade: "12A",
      length: length,
      color: color,
      texture: hairType === "wavy" || hairType === "water_wave" ? "Body Wave" :
             hairType === "deep_wave" ? "Deep Wave" :
             hairType === "kinky_curly" ? "Tight Curls" : "Silky",
    },
    metadata: {
      occasion: ["daily", "party"],
      trending_score: 5,
      search_tags: product.tags || [],
      suitable_face_shapes: ["oval", "round", "heart", "square"],
      maintenance_level: "medium",
      featured: false,
      new_arrival: true,
    },
    inventory: {
      inStock: inStock,
      quantity: inStock ? 10 : 0,
      reserved: 0,
    },
    seo: {
      title: title,
      description: stripHtml(product.description || "").substring(0, 160),
      handle: generateSeoHandle(title),
      keywords: product.tags || [],
    },
    ratings: {
      average: 4.0,
      count: 0,
    },
    timestamps: {
      createdAt: createdAt,
      updatedAt: updatedAt,
    },
  };
}

async function clearCollection(collectionName) {
  console.log(`\n🗑️  Clearing collection: ${collectionName}`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   ✓ Collection already empty`);
    return 0;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`   ✓ Deleted ${snapshot.size} documents`);
  return snapshot.size;
}

async function importProducts(products) {
  console.log(`\n📦 Importing ${products.length} products...`);
  
  const batch = db.batch();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.id);
    
    try {
      batch.set(docRef, product);
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${products.length}`);
      }
    } catch (error) {
      console.error(`   Error with product ${product.id}:`, error.message);
      errorCount++;
    }
  }

  // Commit batch
  await batch.commit();
  console.log(`\n✅ Successfully imported ${successCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Failed to import ${errorCount} products`);
  }
  
  return { success: successCount, errors: errorCount };
}

async function main() {
  try {
    console.log("\n=== CURLY WIGS IMPORT ===\n");
    
    // Read raw data
    console.log("📂 Reading raw data...");
    const rawData = require(inputFile);
    console.log(`   Found ${rawData.length} products`);

    // Transform to Firestore format
    console.log("🔄 Transforming products...");
    const transformedProducts = rawData.map((p, i) => transformToFirestoreProduct(p, i));
    
    // Show hair type distribution
    const hairTypes = {};
    transformedProducts.forEach(p => {
      hairTypes[p.specifications.hair_type] = (hairTypes[p.specifications.hair_type] || 0) + 1;
    });
    console.log("   Hair type distribution:");
    Object.entries(hairTypes).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`);
    });

    // Clear existing products (optional - comment out to keep existing)
    // await clearCollection(PRODUCTS_COLLECTION);

    // Import products
    const result = await importProducts(transformedProducts);
    
    console.log("\n=== IMPORT COMPLETE ===");
    console.log(`Total imported: ${result.success}`);
    console.log(`Errors: ${result.errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

main();
