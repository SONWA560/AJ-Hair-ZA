import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  
  try {
    if (!getApps().length) {
      return initializeApp(firebaseConfig);
    } else {
      return getApp();
    }
  } catch (e) {
    console.error("Failed to initialize Firebase app:", e);
    return undefined;
  }
}

function getFirebaseDb(): Firestore | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  
  try {
    const app = getFirebaseApp();
    if (!app) return undefined;
    return getFirestore(app);
  } catch (e) {
    console.error("Failed to get Firestore:", e);
    return undefined;
  }
}

export const db = getFirebaseDb();
export default getFirebaseApp;
