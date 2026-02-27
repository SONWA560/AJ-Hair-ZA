import * as admin from "firebase-admin";

let _db: admin.firestore.Firestore | null = null;
let _storage: admin.storage.Storage | null = null;
let _auth: admin.auth.Auth | null = null;

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const getAdminDb = (): admin.firestore.Firestore => {
  if (!_db) {
    try {
      initializeFirebase();
      _db = admin.firestore();
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  return _db;
};

export const getAdminStorage = (): admin.storage.Storage => {
  if (!_storage) {
    try {
      initializeFirebase();
      _storage = admin.storage();
    } catch (error) {
      console.error("Failed to initialize Firebase Storage:", error);
      throw error;
    }
  }
  return _storage;
};

export const getAdminAuth = (): admin.auth.Auth => {
  if (!_auth) {
    try {
      initializeFirebase();
      _auth = admin.auth();
    } catch (error) {
      console.error("Failed to initialize Firebase Auth:", error);
      throw error;
    }
  }
  return _auth;
};

export const createTimestamp = (date?: Date): admin.firestore.Timestamp => {
  if (date) {
    return admin.firestore.Timestamp.fromDate(date);
  }
  return admin.firestore.Timestamp.now();
};

export const createId = (): string => {
  return admin.firestore.Timestamp.now().toMillis().toString(36) + Math.random().toString(36).substring(2);
};
