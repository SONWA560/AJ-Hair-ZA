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

async function analyzeProducts() {
  console.log('\nFetching products from Firestore...\n');
  
  const snapshot = await db.collection('products').limit(500).get();
  
  const distribution = {};
  const total = snapshot.size;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const hairType = data.specifications?.hair_type || 'undefined';
    distribution[hairType] = (distribution[hairType] || 0) + 1;
  });
  
  console.log('=== Product Distribution by Hair Type ===\n');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`${type}: ${count} products (${percentage}%)`);
    });
  
  console.log(`\nTotal products analyzed: ${total}\n`);
}

analyzeProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
