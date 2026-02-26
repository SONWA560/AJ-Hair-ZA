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

function parseLengths(lengthStr) {
  if (!lengthStr) return [];
  const lengths = [];
  const inchMatch = lengthStr.match(/(\d+)\s*inch/gi);
  if (inchMatch) {
    inchMatch.forEach(m => {
      const num = m.match(/(\d+)/i)[1];
      lengths.push(`${num}inch`);
    });
  }
  if (lengths.length === 0 && lengthStr.includes("Various")) {
    lengths.push("Various");
  }
  return [...new Set(lengths)];
}

function parseColors(colorStr) {
  if (!colorStr) return ["Natural"];
  const colors = colorStr.split(",").map(c => c.trim());
  return colors.map(c => c.replace(" colour", "").replace("1/", "")).filter(c => c && c !== "Default");
}

function parseLaceTypes(closureStr) {
  if (!closureStr) return ["5x5"];
  const types = [];
  if (closureStr.includes("5x5")) types.push("5x5");
  if (closureStr.includes("6x6")) types.push("6x6");
  if (closureStr.includes("13x6")) types.push("13x6");
  if (closureStr.includes("2x6")) types.push("2x6");
  if (closureStr.includes("4x4")) types.push("4x4");
  if (closureStr.includes("Full Frontal") || closureStr.includes("frontal")) types.push("Full Frontal");
  if (types.length === 0) types.push("Default");
  return [...new Set(types)];
}

function normalizeProductName(name) {
  if (!name) return "";
  return name.trim();
}

function parseVariantName(variantName) {
  if (!variantName) return { length: "16in", laceType: "5x5" };
  
  let length = "16in";
  let laceType = "5x5";
  
  const lengthMatch = variantName.match(/(\d+)\s*inch/i);
  if (lengthMatch) {
    length = `${lengthMatch[1]}inch`;
  }
  
  if (variantName.toLowerCase().includes("6x6")) laceType = "6x6";
  else if (variantName.toLowerCase().includes("5x5")) laceType = "5x5";
  else if (variantName.toLowerCase().includes("13x6")) laceType = "13x6";
  else if (variantName.toLowerCase().includes("2x6")) laceType = "2x6";
  else if (variantName.toLowerCase().includes("4x4")) laceType = "4x4";
  else if (variantName.toLowerCase().includes("full frontal")) laceType = "Full Frontal";
  else if (variantName.toLowerCase().includes("glueless")) laceType = "Glueless";
  
  return { length, laceType };
}

function generateVariants(products) {
  const productMap = new Map();
  
  products.forEach(product => {
    const baseName = normalizeProductName(product.title);
    const baseKey = baseName.toLowerCase();
    
    const { length, laceType } = parseVariantName(product.variant_name);
    const color = product.attributes?.color || "Natural";
    
    if (!productMap.has(baseKey)) {
      productMap.set(baseKey, {
        id: product.id,
        title: product.title,
        description: product.description,
        image_url: product.images?.[0]?.url,
        brand: "Shara Hair ZA",
        specifications: product.specifications,
        seo: product.seo,
        metadata: product.metadata,
        ratings: product.ratings,
        timestamps: product.timestamps,
        price: product.price,
        rawVariants: [],
        options: { length: new Set(), color: new Set(), lace_type: new Set() }
      });
    }
    
    const grouped = productMap.get(baseKey);
    
    grouped.options.length.add(length);
    grouped.options.color.add(color);
    grouped.options.lace_type.add(laceType);
    
    grouped.rawVariants.push({
      originalId: product.id,
      price: product.price,
      length,
      color,
      laceType,
      inStock: product.inventory?.inStock ?? true,
      quantity: product.inventory?.quantity ?? 0
    });
  });
  
  return Array.from(productMap.values());
}

function createVariantOptions(options) {
  const result = [];
  
  const lengthValues = Array.from(options.length).sort((a, b) => {
    const aNum = parseInt(a.replace("inch", ""));
    const bNum = parseInt(b.replace("inch", ""));
    return aNum - bNum;
  });
  
  if (lengthValues.length > 0) {
    result.push({
      id: "length",
      name: "Length",
      values: lengthValues
    });
  }
  
  const colorValues = Array.from(options.color);
  if (colorValues.length > 0) {
    result.push({
      id: "color",
      name: "Color",
      values: colorValues
    });
  }
  
  const laceValues = Array.from(options.lace_type);
  if (laceValues.length > 0) {
    result.push({
      id: "lace_type",
      name: "Lace Type",
      values: laceValues
    });
  }
  
  return result;
}

function generateAllVariantCombinations(options, baseProduct) {
  const lengths = options.find(o => o.name === "Length")?.values || [];
  const colors = options.find(o => o.name === "Color")?.values || [];
  const laceTypes = options.find(o => o.name === "Lace Type")?.values || [];
  
  console.log(`   Generating: lengths=${lengths.length}, colors=${colors.length}, laceTypes=${laceTypes.length}`);
  
  const combinations = [];
  
  for (const length of lengths) {
    for (const color of colors) {
      for (const laceType of laceTypes) {
        const cleanColor = color.replace(/\s+/g, "-").toLowerCase();
        const cleanLace = laceType.replace(/\s+/g, "-").toLowerCase();
        const variantId = `${baseProduct.id}-${length}-${cleanColor}-${cleanLace}`;
        
        const existingVariant = baseProduct.rawVariants?.find(v => 
          v.length === length &&
          v.color === color &&
          v.laceType === laceType
        );
        
        const isInStock = existingVariant ? existingVariant.inStock : (Math.random() < 0.8);
        const quantity = existingVariant ? existingVariant.quantity : (isInStock ? Math.floor(Math.random() * 20) + 1 : 0);
        
        const price = existingVariant ? existingVariant.price : baseProduct.price;
        
        combinations.push({
          id: variantId,
          title: `${length} - ${color} - ${laceType}`,
          availableForSale: isInStock,
          selectedOptions: [
            { name: "Length", value: length },
            { name: "Color", value: color },
            { name: "Lace Type", value: laceType }
          ],
          price: {
            amount: price.toString(),
            currencyCode: "ZAR"
          },
          inventory: {
            inStock: isInStock,
            quantity: quantity
          }
        });
      }
    }
  }
  
  return combinations;
}

async function processProducts() {
  console.log("📦 Fetching products from Firestore...");
  
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => doc.data());
  
  console.log(`   Found ${products.length} products`);
  
  console.log("🔄 Grouping products by base name...");
  const groupedProducts = generateVariants(products);
  
  console.log(`   Created ${groupedProducts.length} grouped products`);
  
  const transformedProducts = groupedProducts.map(grouped => {
    const options = createVariantOptions(grouped.options);
    const allVariants = generateAllVariantCombinations(options, grouped);
    
    return {
      id: grouped.id,
      title: grouped.title,
      description: grouped.description,
      description_for_ai: grouped.description?.substring(0, 500) || "",
      price: allVariants[0]?.price ? parseFloat(allVariants[0].price.amount) : grouped.price,
      currency: "ZAR",
      images: [
        {
          url: grouped.image_url,
          alt: grouped.title,
          width: 800,
          height: 1200
        }
      ],
      specifications: grouped.specifications,
      options: options,
      variants: allVariants,
      metadata: grouped.metadata,
      inventory: {
        inStock: allVariants.some(v => v.inventory.inStock),
        quantity: allVariants.reduce((sum, v) => sum + v.inventory.quantity, 0),
        reserved: 0
      },
      seo: grouped.seo,
      ratings: grouped.ratings,
      timestamps: grouped.timestamps
    };
  });
  
  return transformedProducts;
}

async function clearAndImport(products) {
  console.log("\n🗑️  Clearing products collection...");
  const snapshot = await db.collection("products").get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`   Deleted ${snapshot.size} documents`);
  
  console.log("\n📥 Importing transformed products...");
  let imported = 0;
  
  for (const product of products) {
    await db.collection("products").doc(product.id).set(product);
    imported++;
    if (imported % 5 === 0) {
      console.log(`   Imported ${imported}/${products.length}`);
    }
  }
  
  console.log(`   ✅ Imported ${imported} products with variants`);
}

async function verifyImport() {
  console.log("\n🔍 Verifying import...");
  
  const snapshot = await db.collection("products").get();
  console.log(`   Total products: ${snapshot.size}`);
  
  const sampleDoc = snapshot.docs[0].data();
  console.log(`\n   Sample Product:`);
  console.log(`   - Title: ${sampleDoc.title}`);
  console.log(`   - Options: ${sampleDoc.options?.length || 0}`);
  console.log(`   - Variants: ${sampleDoc.variants?.length || 0}`);
  
  if (sampleDoc.variants && sampleDoc.variants.length > 0) {
    console.log(`   - Sample Variant:`);
    console.log(`     * ID: ${sampleDoc.variants[0].id}`);
    console.log(`     * Price: ${sampleDoc.variants[0].price.amount}`);
    console.log(`     * In Stock: ${sampleDoc.variants[0].inventory.inStock} (qty: ${sampleDoc.variants[0].inventory.quantity})`);
    console.log(`     * Options: ${sampleDoc.variants[0].selectedOptions.map(o => `${o.name}: ${o.value}`).join(", ")}`);
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("🚀 Transforming Products with Variants");
  console.log("=".repeat(50));
  
  const products = await processProducts();
  
  await clearAndImport(products);
  
  await verifyImport();
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ VARIANT TRANSFORMATION COMPLETE!");
  console.log("=".repeat(50));
  
  const summary = products.reduce((acc, p) => {
    acc.totalVariants += p.variants?.length || 0;
    acc.totalStock += p.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) || 0;
    return acc;
  }, { totalVariants: 0, totalStock: 0 });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Total Variants: ${summary.totalVariants}`);
  console.log(`   Total Stock: ${summary.totalStock} units`);
}

main().catch(console.error);
