import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "tellmamma";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@tellmamma.iam.gserviceaccount.com";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    console.log("🔧 Firebase Admin SDK Setup:");
    console.log("  - Project ID from env:", !!process.env.FIREBASE_PROJECT_ID);
    console.log("  - Client Email from env:", !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log("  - Private Key from env:", !!process.env.FIREBASE_PRIVATE_KEY);
    
    if (!privateKey) {
      console.error("❌ FIREBASE_PRIVATE_KEY environment variable is not set!");
      console.error("Please add the Firebase service account private key to .env");
      throw new Error("Firebase admin SDK not properly configured - missing FIREBASE_PRIVATE_KEY");
    }
    
    console.log("📝 Firebase Admin SDK Configuration:");
    console.log("  - Project ID:", projectId);
    console.log("  - Client Email:", clientEmail);
    console.log("  - Private Key length:", privateKey.length);
    console.log("  - Private Key starts with:", privateKey.substring(0, 50));
    
    let formattedKey = privateKey;
    if (formattedKey.includes('\\n')) {
      console.log("  - Converting escaped newlines...");
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }
    
    console.log("  - Formatted Key starts with:", formattedKey.substring(0, 50));
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
    console.log("✅ Firebase Admin initialized successfully");
  }
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    console.log("✅ Firebase Auth and Firestore ready");
  } else {
    throw new Error("Firebase Admin App not initialized");
  }
} catch (error: any) {
  console.error("❌ Firebase Admin initialization error:", error.message);
  console.error("Full error:", error);
  throw error;
}

export { db, auth };
