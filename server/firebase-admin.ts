import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    // Initialize Firebase Admin with environment variables only
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing required Firebase Admin credentials. Please set:\n" +
        "  - FIREBASE_PROJECT_ID\n" +
        "  - FIREBASE_CLIENT_EMAIL\n" +
        "  - FIREBASE_PRIVATE_KEY"
      );
    }

    // Use service account credentials from environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newlines with actual newlines
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("✓ Firebase Admin initialized with service account credentials");
  }
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  console.log("⚠ Continuing without Firebase Admin - authentication will not work");
}

export { db, auth };
