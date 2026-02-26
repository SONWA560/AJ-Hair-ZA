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
const cwd = process.cwd();

// Helper functions
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Transform functions for curly wigs
function extractHairType(title) {
  const t = title.toLowerCase();
  if (t.includes("water wave")) return "water_wave";
  if (t.includes("deep curl") || t.includes("deep wave")) return "deep_wave";
  if (t.includes("kinky curl") || t.includes("kinky straight")) return "kinky_curly";
  if (t.includes("wavy") || t.includes("wave")) return "wavy";
  if (t.includes("curly") || t.includes("curl")) return "kinky_curly";
  if (t.includes("bob")) return "straight";
  return "wavy";
}

function extractLength(title) {
  const match = title.match(/(\d+)\s*["inchin]*/i);
  if (match) return match[1] + "in";
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
  return "5x5";
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
  if (t.includes("jet black") || t.includes(" 1 ")) return "Jet Black";
  return "Natural Black";
}

function generateSeoHandle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
}

function getTexture(hairType) {
  switch (hairType) {
    case "wavy": return "Body Wave";
    case "water_wave": return "Water Wave";
    case "deep_wave": return "Deep Wave";
    case "kinky_curly": return "Tight Curls";
    case "coily": return "Coily";
    case "straight": return "Silky Straight";
    default: return "Natural";
  }
}

// Generate options and variants for a product
function generateOptionsAndVariants(specs) {
  const options = [];
  const variants = [];

  // Length option
  if (specs.length) {
    options.push({
      id: "length",
      name: "Length",
      values: [specs.length]
    });
  }

  // Color option
  if (specs.color) {
    options.push({
      id: "color",
      name: "Color",
      values: [specs.color]
    });
  }

  // Lace type option
  if (specs.lace_type) {
    options.push({
      id: "lace_type",
      name: "Lace Type",
      values: [specs.lace_type]
    });
  }

  // Generate one variant per combination (simplified - one variant for now)
  const variantOptions = [];
  if (specs.length) variantOptions.push({ name: "Length", value: specs.length });
  if (specs.color) variantOptions.push({ name: "Color", value: specs.color });
  if (specs.lace_type) variantOptions.push({ name: "Lace Type", value: specs.lace_type });

  variants.push({
    id: `${specs.hair_type}-${specs.length}-${specs.color}-${specs.lace_type}`.replace(/\s/g, "-").toLowerCase(),
    title: [specs.length, specs.color, specs.lace_type].filter(Boolean).join(" / "),
    availableForSale: true,
    selectedOptions: variantOptions,
    price: { amount: "0", currencyCode: "ZAR" },
    inventory: { inStock: true, quantity: 10 }
  });

  return { options, variants };
}

// Transform curly wig product
function transformCurlyWig(product, index) {
  const title = product.title || "Untitled Product";
  const hairType = extractHairType(title);
  const length = extractLength(title);
  const laceType = extractLaceType(title);
  const color = extractColor(title);
  const specs = { hair_type: hairType, length, lace_type: laceType, color };

  const allImages = (product.medias || []).slice(0, 6).map((m, i) => ({
    url: m.url,
    alt: title + (i > 0 ? ` - Image ${i + 1}` : ""),
    width: 800,
    height: 1200,
  }));

  const priceInCents = product.variants?.[0]?.price?.current || 0;
  const price = Math.round(priceInCents / 100);
  const stockStatus = product.variants?.[0]?.price?.stockStatus || "InStock";
  const inStock = stockStatus === "InStock";

  const createdAt = product.source?.createdUTC ? new Date(product.source.createdUTC) : new Date();
  const updatedAt = product.source?.updatedUTC ? new Date(product.source.updatedUTC) : new Date();

  const { options, variants } = generateOptionsAndVariants(specs);

  return {
    id: product.source?.id?.toString() || `curly-${index}`,
    title,
    description: stripHtml(product.description || "").substring(0, 1000),
    description_for_ai: stripHtml(product.description || "").substring(0, 500),
    price,
    currency: "ZAR",
    images: allImages,
    specifications: {
      ...specs,
      density: "180%",
      hair_grade: "12A",
      texture: getTexture(hairType),
    },
    options,
    variants,
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
      inStock,
      quantity: inStock ? 10 : 0,
      reserved: 0,
    },
    seo: {
      title,
      description: stripHtml(product.description || "").substring(0, 160),
      handle: generateSeoHandle(title),
      keywords: product.tags || [],
    },
    ratings: { average: 4.0, count: 0 },
    timestamps: { createdAt, updatedAt },
  };
}

// Transform old format product
function transformOldProduct(product, index) {
  const nameLower = product.name?.toLowerCase() || "";
  
  const hairTypeMap = {
    "bone straight": "straight", straight: "straight",
    "body wave": "body_wave", "deep wave": "deep_wave",
    "water wave": "water_wave", curly: "kinky_curly", wavy: "wavy",
  };
  
  let hairType = "straight";
  for (const [key, value] of Object.entries(hairTypeMap)) {
    if (nameLower.includes(key)) { hairType = value; break; }
  }

  const specs = {
    hair_type: hairType,
    lace_type: product.attributes?.closure || "5x5",
    density: product.attributes?.density || "180%",
    hair_grade: product.attributes?.grade || "12A",
    length: product.attributes?.length || "16in",
    color: product.attributes?.color || "Natural Black",
    texture: nameLower.includes("wave") ? "Body Wave" : 
             nameLower.includes("curly") ? "Tight Curls" : "Silky Straight",
  };

  const { options, variants } = generateOptionsAndVariants(specs);

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    description_for_ai: product.description?.substring(0, 500) || "",
    price: product.price,
    currency: "ZAR",
    images: [{ url: product.image_url, alt: product.name, width: 800, height: 1200 }],
    specifications: specs,
    options,
    variants,
    metadata: {
      occasion: product.metadata?.occasion || ["daily"],
      trending_score: product.metadata?.trending_score || 5,
      search_tags: product.metadata?.search_tags || product.tags || [],
      suitable_face_shapes: product.metadata?.suitable_face_shapes || ["oval", "round", "heart", "square"],
      maintenance_level: product.metadata?.maintenance_level || "medium",
      featured: product.metadata?.featured || false,
      new_arrival: product.metadata?.new_arrival || false,
    },
    inventory: {
      inStock: product.inventory?.inStock ?? true,
      quantity: product.inventory?.quantity ?? 10,
      reserved: product.inventory?.reserved ?? 0,
    },
    seo: {
      title: product.seo?.title || product.name,
      description: product.seo?.description || product.description?.substring(0, 160) || "",
      handle: product.seo?.handle || generateSeoHandle(product.name),
      keywords: product.seo?.keywords || product.tags || [],
    },
    ratings: { average: product.ratings?.average || 4.0, count: product.ratings?.count || 0 },
    timestamps: {
      createdAt: new Date(product.timestamps?.createdAt || Date.now()),
      updatedAt: new Date(product.timestamps?.updatedAt || Date.now()),
    },
  };
}

async function clearCollection() {
  console.log(`\n🗑️  Clearing collection: ${PRODUCTS_COLLECTION}`);
  const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
  if (snapshot.empty) { console.log("   ✓ Already empty"); return 0; }
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`   ✓ Deleted ${snapshot.size} documents`);
  return snapshot.size;
}

async function importProducts(products) {
  console.log(`\n📦 Importing ${products.length} products...`);
  const batch = db.batch();
  let successCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.id);
    batch.set(docRef, product);
    successCount++;
    
    if ((i + 1) % 10 === 0) console.log(`   Progress: ${i + 1}/${products.length}`);
  }

  await batch.commit();
  console.log(`✅ Successfully imported ${successCount} products`);
  return successCount;
}

async function main() {
  try {
    console.log("\n=== COMPREHENSIVE PRODUCT IMPORT ===\n");

    // Load old products
    console.log("📂 Loading old products...");
    const oldProducts = require(path.join(cwd, "INF4027W_MiniPRJ_Products_Enhanced.json"));
    console.log(`   Found ${oldProducts.length} old products`);

    // Load new curly products
    console.log("📂 Loading curly wig products...");
    const curlyProducts = require(path.join(cwd, "curly_wigs_raw_dataset.json"));
    console.log(`   Found ${curlyProducts.length} curly products`);

    // Transform all products
    console.log("🔄 Transforming products...");
    const transformedOld = oldProducts.map((p, i) => transformOldProduct(p, i));
    const transformedCurly = curlyProducts.map((p, i) => transformCurlyWig(p, i));
    const allProducts = [...transformedOld, ...transformedCurly];

    // Show hair type distribution
    const hairTypes = {};
    allProducts.forEach(p => {
      const type = p.specifications.hair_type;
      hairTypes[type] = (hairTypes[type] || 0) + 1;
    });
    console.log("   Hair type distribution:");
    Object.entries(hairTypes).forEach(([type, count]) => console.log(`      ${type}: ${count}`));

    // Verify options are present
    const productsWithOptions = allProducts.filter(p => p.options && p.options.length > 0).length;
    console.log(`\n   Products with options: ${productsWithOptions}/${allProducts.length}`);

    // Clear and re-import
    await clearCollection();
    const result = await importProducts(allProducts);
    
    console.log("\n=== IMPORT COMPLETE ===");
    console.log(`Total imported: ${result}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

main();
