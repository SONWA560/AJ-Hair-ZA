require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const fs = require("fs");

// Firebase Admin initialization
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Load upload results from the previous step
function loadUploadResults() {
  const resultsPath = "./upload-results.json";

  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Upload results file not found: ${resultsPath}`);
    console.log("Please run 'node scripts/upload-product-images.js' first");
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  console.log(`📂 Loaded ${results.length} upload results`);

  return results;
}

// Update single product in Firestore
async function updateProductImage(productId, imageUrl, dimensions, altText) {
  try {
    const productRef = db.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      console.log(`⚠️  Product ${productId} not found in Firestore`);
      return false;
    }

    // Update only the images array, preserving all other data
    const newImageData = {
      url: imageUrl,
      alt: altText,
      width: dimensions.width,
      height: dimensions.height,
    };

    await productRef.update({
      images: [newImageData],
      timestamps: {
        updatedAt: admin.firestore.Timestamp.now(),
      },
    });

    console.log(`✓ Updated product ${productId} with new image`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to update product ${productId}:`, error);
    return false;
  }
}

// Update all products with new image URLs
async function updateAllProducts() {
  console.log("🔄 Starting database update process...");

  try {
    const uploadResults = loadUploadResults();

    // Filter out failed uploads
    const successfulUploads = uploadResults.filter((result) => !result.error);
    const failedUploads = uploadResults.filter((result) => result.error);

    console.log(
      `\n📊 Processing ${successfulUploads.length} successful uploads`,
    );

    if (failedUploads.length > 0) {
      console.log(`⚠️  Skipping ${failedUploads.length} failed uploads`);
    }

    // Update products in batches to avoid overwhelming Firestore
    const batchSize = 10;
    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < successfulUploads.length; i += batchSize) {
      const batch = successfulUploads.slice(i, i + batchSize);

      console.log(
        `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(successfulUploads.length / batchSize)}`,
      );

      for (const result of batch) {
        const success = await updateProductImage(
          result.productId,
          result.imageUrl,
          result.dimensions,
          result.alt,
        );

        if (success) {
          updatedCount++;
        } else {
          failedCount++;
        }

        // Small delay between updates
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Summary
    console.log(`\n🎉 Database Update Summary:`);
    console.log(`✓ Successfully updated: ${updatedCount} products`);
    console.log(`✗ Failed to update: ${failedCount} products`);
    console.log(`📄 Total processed: ${successfulUploads.length} products`);

    // Create a report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: successfulUploads.length,
        updated: updatedCount,
        failed: failedCount,
      },
      failedUploads: failedUploads.map((f) => ({
        productId: f.productId,
        imageFile: f.imageFile,
        error: f.error,
      })),
    };

    const reportPath = "./update-report.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return report;
  } catch (error) {
    console.error("❌ Database update failed:", error);
    process.exit(1);
  }
}

// Verify updates by checking a few products
async function verifyUpdates() {
  console.log("\n🔍 Verifying updates...");

  try {
    const uploadResults = loadUploadResults();
    const sampleSize = Math.min(5, uploadResults.length);
    const sample = uploadResults.slice(0, sampleSize);

    for (const result of sample) {
      if (result.error) continue;

      const productRef = db.collection("products").doc(result.productId);
      const productDoc = await productRef.get();

      if (productDoc.exists) {
        const product = productDoc.data();
        const imageUrl = product.images[0]?.url;

        if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
          console.log(
            `✓ Product ${result.productId}: Image URL updated correctly`,
          );
        } else {
          console.log(
            `⚠️  Product ${result.productId}: Image URL may not be updated`,
          );
        }
      }
    }

    console.log("✅ Verification completed");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting product image update process...\n");

  try {
    // Update all products
    await updateAllProducts();

    // Verify updates
    await verifyUpdates();

    console.log(
      "\n🎊 All done! Your product images have been updated in the database.",
    );
    console.log("\n📝 Next steps:");
    console.log("1. Test your website to ensure images display correctly");
    console.log("2. Check the product pages for proper image loading");
    console.log("3. Verify image optimization is working");

    process.exit(0);
  } catch (error) {
    console.error("❌ Process failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateAllProducts, verifyUpdates };
