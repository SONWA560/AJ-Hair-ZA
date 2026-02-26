require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

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
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET?.replace("gs://", "") ||
      `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

// Product IDs provided by user
const productIds = [
  "2iPPlESWN4NdIFQuYoaw",
  "3WfQZH42XiWSgaQIV23l",
  "4TgJy804QNslgSjPQXzg",
  "4WsJw2kvsIH6My2ml080",
  "4hCdKih0VbhyeysqXfth",
  "58QAJ5Wp7d2GQ4I7peYl",
  "5MPrWf4KLkBPJQTwQiPc",
  "5i7RVLJBoylSU9w8pbaz",
  "64955ImLjMDiZyUQ0DhH",
  "8L0IsWuVxaNqKZ3EyeCL",
  "8Lve8ztBEeL7SKhlBrGe",
  "96vr67bB0JRPyWEu3xBp",
  "979veDSaYtsPrBcqqAMW",
  "9o4KszqQl4wjNiKTl3NH",
  "9ym05jl98ndNLtE2U84w",
  "AZdaMxA7MSVpnMmNEEV7",
  "BJT4gKHX2F7BV6AFziti",
  "BOwtqCa064wlaQBk6H4k",
  "D2Qi0GeGVpJtKabcp0dU",
  "DIaqhtMUhM4ZNGHTLaKI",
  "Dv6jO7H2PTzWDeoMEOTG",
  "EivT53FJpS4bMMnPGsQF",
  "FJs5cz6McueUDoO3cijS",
  "FpxIhiRpE988XqkOB3bo",
  "GIgyLoVR2PAqhCFgyarT",
  "GSaKmZCPSwPg48D7NEIi",
  "GYteBuxAKdULCrmSKpkh",
  "Gj7QuZFS2VjWbhtjJqQg",
  "GsZ7A4CW3LLJkYVWtU4d",
  "HH6gzQY5ON0afChdyFWj",
  "HHjd6z3TrXSMOpNkRkzO",
  "HT49BvDGk4QvDUlh76Ma",
  "HzXSUjQYeQxDQRpHizCJ",
  "IwXZRG9nxpKAw54nsvEJ",
  "KzTu7XAZwU3VdilmWq3m",
  "L7uJqoFtp0UxyZ6B9eRN",
  "LPldezsb5IuZ7tKvubGJ",
  "LhdLuwyZTPK3EJfcCOib",
  "OAWhQWzLj1y0Bx1ab94K",
  "PJlj8rUo847pEgog0Evq",
  "Q7A7tKNQGhagVaod4741",
  "Qfe8DtnTy7aR8Q7xX99O",
  "TC3fkHUZ171mZf9MHiAk",
  "Ug7kHKl1lONuAZvRj4y3",
  "V35Med86MLBkva49HvDt",
  "VdlYwsig0irzJDfbJAZb",
  "VzDdEQ9jbusLo9SeMQkd",
  "XH3mP5B5NQBGyN1SI6bg",
  "XnP5EtCLaUM5JHQDz9iS",
  "XnzthCScNRSHdvkXjmCx",
  "YOKUIwhQU3t3UMBaxskb",
  "YTulc4CxquIHgGg0rKvO",
  "Yjwl00szOhLD7w8rsLpi",
  "Ynd48DXewE3xb3KiiVMx",
  "ZPxQl3MfrsQ02twE0Zdh",
  "ZXupVxA4u78uFZiuKAjX",
  "a3A9ePE4FyTczzVp0Glv",
  "aYvA8SYpRYhm2xRlo16H",
  "awSPLix2o40wNMNtZDuq",
  "b243tIVBTdYulb9YdMKM",
  "chfuu4AGJpJaZdoShZRU",
  "d82IY1HEZDBC4DsnsziW",
  "eQx5WlQ2em81673XciFz",
  "ecWAfiuUCylu58GHZdsd",
  "fa567lExdGy57IaHmUSl",
  "fx7oJrM5vwK68sY4coZ0",
  "guNTEUOdBmoS9FmbGVca",
  "gucw7Okjaqluf7tKerJN",
  "hHMYVZHOxo5dI3GikLjk",
  "hcbm8SyjrZZgou991xMt",
  "iijN3nGRS593xWz5YK7T",
  "j6GMlWD5d6NxpXSJhh5p",
  "l7I9rCiC6lm30ZVzxRVs",
  "m9bDjq78vrwqJ9fOcySu",
  "mbklo2Q6FG6pjTOys7hc",
  "ntoLVZ55zRjI4B4tmMzA",
  "oFRUEkEOTi92U6B7VfyC",
  "od5qLvKZmgYmE3Ysjq75",
  "pRNNnBBDAlTeSeHY1QNR",
  "twcnw7bvtkptep2qJaQM",
  "uuWmumix790NxTS4gsLb",
  "uull45294DD0x9hPvEAM",
  "vVRVYn7NEKx3SHO2geEn",
  "vdYJYbTpPbvWgPMwObXX",
  "wYZQs7JGmR7cctlt4SQ1",
  "wdGIDZZkxIwGbf88fCke",
  "ww6Km4QuZ1qR1T6JyskI",
  "xJoxJBsi8VaHucTb9HpS",
];

// Get image files from downloads/wigs directory
function getImageFiles() {
  const wigsDir = path.join(process.cwd(), "downloads", "wigs");

  if (!fs.existsSync(wigsDir)) {
    console.error(`Directory not found: ${wigsDir}`);
    console.log(
      "Please create the downloads/wigs directory and add your image files.",
    );
    process.exit(1);
  }

  const files = fs.readdirSync(wigsDir);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
  );

  console.log(`Found ${imageFiles.length} image files in ${wigsDir}`);
  return imageFiles;
}

// Create random mapping of products to images
function createImageMapping(productIds, imageFiles) {
  const mapping = {};

  // Shuffle image files for random assignment
  const shuffledImages = [...imageFiles].sort(() => Math.random() - 0.5);

  productIds.forEach((productId, index) => {
    const imageFile = shuffledImages[index % shuffledImages.length];
    mapping[productId] = imageFile;
  });

  return mapping;
}

// Upload single image to Firebase Storage
async function uploadImage(imageFile, productId) {
  const wigsDir = path.join(process.cwd(), "downloads", "wigs");
  const imagePath = path.join(wigsDir, imageFile);
  const storagePath = `products/${productId}/images/${imageFile}`;

  try {
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        contentType: getContentType(imageFile),
        metadata: {
          productId: productId,
          originalName: imageFile,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Get public URL
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Far future date
    });

    console.log(`✓ Uploaded ${imageFile} for product ${productId}`);
    return url;
  } catch (error) {
    console.error(
      `✗ Failed to upload ${imageFile} for product ${productId}:`,
      error,
    );
    throw error;
  }
}

// Get content type based on file extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return contentTypes[ext] || "image/jpeg";
}

// Get image dimensions (simplified version)
async function getImageDimensions(imageFile) {
  // For now, return default dimensions
  // In a real implementation, you'd use sharp or jimp to get actual dimensions
  return { width: 800, height: 1200 };
}

// Main upload function
async function uploadAllImages() {
  console.log("Starting image upload process...");

  try {
    // Get image files
    const imageFiles = getImageFiles();

    if (imageFiles.length === 0) {
      console.error("No image files found in downloads/wigs directory");
      process.exit(1);
    }

    // Create mapping
    const mapping = createImageMapping(productIds, imageFiles);

    // Save mapping to file for reference
    const mappingPath = path.join(process.cwd(), "image-mapping.json");
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`\n📝 Image mapping saved to: ${mappingPath}`);

    // Upload images and collect URLs
    const uploadResults = [];

    for (const [productId, imageFile] of Object.entries(mapping)) {
      try {
        const imageUrl = await uploadImage(imageFile, productId);
        const dimensions = await getImageDimensions(imageFile);

        uploadResults.push({
          productId,
          imageFile,
          imageUrl,
          dimensions,
          alt: generateAltText(productId),
        });

        // Small delay to avoid overwhelming Firebase
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process product ${productId}:`, error);
        uploadResults.push({
          productId,
          imageFile,
          error: error.message,
        });
      }
    }

    // Save upload results
    const resultsPath = path.join(process.cwd(), "upload-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(uploadResults, null, 2));

    // Summary
    const successful = uploadResults.filter((r) => !r.error).length;
    const failed = uploadResults.filter((r) => r.error).length;

    console.log(`\n📊 Upload Summary:`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`📄 Results saved to: ${resultsPath}`);

    if (failed > 0) {
      console.log(
        `\n⚠️  Some uploads failed. Check ${resultsPath} for details.`,
      );
    }

    return uploadResults;
  } catch (error) {
    console.error("Upload process failed:", error);
    process.exit(1);
  }
}

// Generate alt text based on product ID (simplified)
function generateAltText(productId) {
  return `Premium wig product ${productId}`;
}

// Run the upload process
if (require.main === module) {
  uploadAllImages()
    .then(() => {
      console.log("\n🎉 Image upload completed!");
      console.log(
        "\nNext step: Run 'node scripts/update-product-images.js' to update the database",
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("Upload failed:", error);
      process.exit(1);
    });
}

module.exports = { uploadAllImages, createImageMapping };
