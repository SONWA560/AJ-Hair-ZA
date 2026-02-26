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
const PRODUCTS_COLLECTION = "products";

async function removeDuplicates() {
  console.log("\n=== REMOVING DUPLICATES ===\n");

  // Get all products
  const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
  console.log(`Total products before: ${snapshot.size}`);

  // Group by title (case-insensitive)
  const productsByTitle = {};
  snapshot.forEach(doc => {
    const p = doc.data();
    const titleKey = p.title?.toLowerCase().trim() || "unknown";
    if (!productsByTitle[titleKey]) {
      productsByTitle[titleKey] = [];
    }
    productsByTitle[titleKey].push({ doc, data: p });
  });

  // Find duplicates and keep the one with most images
  const toDelete = [];
  const toKeep = [];

  for (const [title, products] of Object.entries(productsByTitle)) {
    if (products.length > 1) {
      // Sort by number of images (keep the one with most images)
      products.sort((a, b) => (b.data.images?.length || 0) - (a.data.images?.length || 0));
      
      // Keep first, mark rest for deletion
      toKeep.push(products[0].doc.id);
      products.slice(1).forEach(p => toDelete.push(p.doc.id));
      
      console.log(`"${title.substring(0, 40)}..." - keeping 1 of ${products.length}`);
    } else {
      toKeep.push(products[0].doc.id);
    }
  }

  console.log(`\nProducts to keep: ${toKeep.length}`);
  console.log(`Products to delete: ${toDelete.length}`);

  if (toDelete.length > 0) {
    // Delete duplicates in batches
    console.log("\n🗑️  Deleting duplicates...");
    const batch = db.batch();
    let deletedCount = 0;

    for (const docId of toDelete) {
      batch.delete(db.collection(PRODUCTS_COLLECTION).doc(docId));
      deletedCount++;

      // Commit in batches of 500
      if (deletedCount % 500 === 0) {
        await batch.commit();
        console.log(`   Deleted ${deletedCount}/${toDelete.length}`);
      }
    }

    // Commit remaining
    if (deletedCount % 500 !== 0) {
      await batch.commit();
    }

    console.log(`\n✅ Deleted ${deletedCount} duplicate products`);
  } else {
    console.log("\n✅ No duplicates to remove");
  }

  // Verify final count
  const finalSnapshot = await db.collection(PRODUCTS_COLLECTION).get();
  console.log(`\nTotal products after: ${finalSnapshot.size}`);
}

removeDuplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
