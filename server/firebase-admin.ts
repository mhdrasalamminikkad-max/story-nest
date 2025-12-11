import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    // Initialize Firebase Admin with environment variables
    // IMPORTANT: All credentials must be stored in environment variables (Replit Secrets)
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("⚠ Firebase Admin credentials not configured in environment variables");
      console.warn("  Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
      throw new Error("Firebase Admin credentials missing");
    }

    // Use service account credentials
    // Handle different private key formats (escaped newlines, JSON-escaped, etc.)
    let formattedKey = privateKey;
    // Replace literal \n with actual newlines
    if (formattedKey.includes('\\n')) {
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }
    // If the key was double-escaped or has \\\\n
    if (formattedKey.includes('\\\\n')) {
      formattedKey = formattedKey.replace(/\\\\n/g, '\n');
    }
    // Ensure proper PEM format - should start with -----BEGIN
    if (!formattedKey.includes('-----BEGIN')) {
      console.error("⚠ Private key does not appear to be in PEM format");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
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
