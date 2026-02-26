import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Check if environment variables are set (allow programmatic setting for testing)
    const missingVars = [
      !process.env.FIREBASE_PROJECT_ID && "FIREBASE_PROJECT_ID",
      !process.env.FIREBASE_CLIENT_EMAIL && "FIREBASE_CLIENT_EMAIL",
      !process.env.FIREBASE_PRIVATE_KEY && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);

    if (missingVars.length > 0) {
      console.error(
        "❌ Missing Firebase environment variables:",
        missingVars.join(", "),
      );
      console.error(
        "FIREBASE_PROJECT_ID:",
        process.env.FIREBASE_PROJECT_ID ? "✅" : "❌",
      );
      console.error(
        "FIREBASE_CLIENT_EMAIL:",
        process.env.FIREBASE_CLIENT_EMAIL ? "✅" : "❌",
      );
      console.error(
        "FIREBASE_PRIVATE_KEY:",
        process.env.FIREBASE_PRIVATE_KEY ? "✅" : "❌",
      );

      // Only throw error if not in test mode
      if (process.env.NODE_ENV !== "test") {
        throw new Error("Missing required Firebase environment variables");
      } else {
        console.warn("⚠️  Proceeding in test mode");
      }
    }

    const serviceAccountKey = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    } as any; // Use any to bypass TypeScript strict checking for now

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

// Export admin services with lazy loading
let _adminDb: ReturnType<typeof getFirestore> | null = null;
let _adminStorage: ReturnType<typeof getStorage> | null = null;
let _adminAuth: ReturnType<typeof admin.auth> | null = null;

export const getAdminDb = () => {
  if (!_adminDb) {
    if (!admin.apps.length) {
      throw new Error(
        "Firebase Admin is not initialized. Missing environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
      );
    }
    _adminDb = getFirestore();
  }
  return _adminDb;
};

export const getAdminStorage = () => {
  if (!_adminStorage) {
    if (!admin.apps.length) {
      throw new Error(
        "Firebase Admin is not initialized. Missing environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
      );
    }
    _adminStorage = getStorage();
  }
  return _adminStorage;
};

export const getAdminAuth = () => {
  if (!_adminAuth) {
    if (!admin.apps.length) {
      throw new Error(
        "Firebase Admin is not initialized. Missing environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
      );
    }
    _adminAuth = admin.auth();
  }
  return _adminAuth;
};

// Helper functions for common operations
export const createTimestamp = (date?: Date) =>
  admin.firestore.Timestamp.fromDate(date || new Date());

export const createId = () => admin.firestore().collection("_").doc().id;
