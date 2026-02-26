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

const PRODUCTS_COLLECTION = "products";
const inputFile = path.join(process.cwd(), "INF4027W_MiniPRJ_Products_Enhanced.json");

function transformToFirestoreProduct(product) {
  const hairTypeMap = {
    "bone straight": "straight",
    straight: "straight",
    "body wave": "body_wave",
    "deep wave": "deep_wave",
    "water wave": "water_wave",
    curly: "kinky_curly",
    wavy: "wavy",
  };

  const nameLower = product.name.toLowerCase();
  let hairType = "straight";
  for (const [key, value] of Object.entries(hairTypeMap)) {
    if (nameLower.includes(key)) {
      hairType = value;
      break;
    }
  }

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    description_for_ai: product.description.substring(0, 500),
    price: product.price,
    currency: "ZAR",
    images: [
      {
        url: product.image_url,
        alt: product.name,
        width: 800,
        height: 1200,
      },
    ],
    specifications: {
      hair_type: hairType,
      lace_type: product.attributes?.closure || "5x5",
      density: "180%",
      hair_grade: product.attributes?.grade || "12A",
      length: product.attributes?.length || "16in",
      color: product.attributes?.color || "Natural Black",
      texture: nameLower.includes("wave")
        ? "Body Wave"
        : nameLower.includes("curly")
        ? "Tight Curls"
        : "Silky Straight",
    },
    metadata: {
      occasion: product.metadata?.occasion || ["daily"],
      trending_score: product.metadata?.trending_score || 5,
      search_tags: product.metadata?.search_tags || product.tags || [],
      suitable_face_shapes: product.metadata?.suitable_face_shapes || [
        "oval",
        "round",
        "heart",
        "square",
      ],
      maintenance_level: product.metadata?.maintenance_level || "medium",
      featured: product.metadata?.featured || false,
      new_arrival: product.metadata?.new_arrival || false,
    },
    inventory: {
      inStock: product.inventory?.inStock ?? true,
      quantity: product.inventory?.quantity ?? 0,
      reserved: product.inventory?.reserved ?? 0,
    },
    seo: {
      title: product.seo?.title || product.name,
      description: product.seo?.description || product.description?.substring(0, 160) || "",
      handle: product.seo?.handle || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      keywords: product.seo?.keywords || product.tags || [],
    },
    ratings: {
      average: product.ratings?.average || 4.0,
      count: product.ratings?.count || 0,
    },
    timestamps: {
      createdAt: new Date(product.timestamps?.createdAt || Date.now()),
      updatedAt: new Date(product.timestamps?.updatedAt || Date.now()),
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
  const batchSize = 500;
  let importedCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const firestoreProduct = transformToFirestoreProduct(product);
    
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.id.toString());
    batch.set(docRef, firestoreProduct);
    
    importedCount++;
    
    if ((i + 1) % batchSize === 0 || i === products.length - 1) {
      await batch.commit();
      console.log(`   ✓ Imported batch: ${Math.min(i + 1, products.length)}/${products.length}`);
      
      if (i < products.length - 1) {
        const newBatch = db.batch();
        batch._ops = [];
        batch._writer = db.batch();
      }
    }
  }
  
  return importedCount;
}

async function verifyImport(expectedCount) {
  console.log(`\n🔍 Verifying import...`);
  
  const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
  const actualCount = snapshot.size;
  
  console.log(`   Expected: ${expectedCount}`);
  console.log(`   Actual:   ${actualCount}`);
  
  if (actualCount === expectedCount) {
    console.log(`   ✓ Verification passed!`);
    
    const sampleDoc = snapshot.docs[0].data();
    console.log(`\n📝 Sample document (${snapshot.docs[0].id}):`);
    console.log(`   Title: ${sampleDoc.title}`);
    console.log(`   Price: ${sampleDoc.price} ${sampleDoc.currency}`);
    console.log(`   SEO Handle: ${sampleDoc.seo.handle}`);
    console.log(`   In Stock: ${sampleDoc.inventory.inStock} (qty: ${sampleDoc.inventory.quantity})`);
    console.log(`   Featured: ${sampleDoc.metadata.featured}`);
    console.log(`   Trending Score: ${sampleDoc.metadata.trending_score}`);
    
    return true;
  } else {
    console.log(`   ❌ Verification failed!`);
    return false;
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("🚀 Firestore Product Import");
  console.log("=".repeat(50));
  
  console.log(`\n📁 Reading input file: ${inputFile}`);
  const inputData = fs.readFileSync(inputFile, "utf8");
  const products = JSON.parse(inputData);
  console.log(`   Loaded ${products.length} products`);
  
  const deletedCount = await clearCollection(PRODUCTS_COLLECTION);
  
  const importedCount = await importProducts(products);
  
  const verified = await verifyImport(importedCount);
  
  console.log("\n" + "=".repeat(50));
  if (verified) {
    console.log("✅ IMPORT COMPLETE - SUCCESS!");
  } else {
    console.log("❌ IMPORT COMPLETE - VERIFICATION FAILED!");
    process.exit(1);
  }
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
