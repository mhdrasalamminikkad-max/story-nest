import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAi4MmMyAy3DXNV0HWkYx9G7aw415EJK2k",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "tellmamma"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tellmamma",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "tellmamma"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "820379114528",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:820379114528:web:479b678dfcc7ecaab07045",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GPLM6TS2T7"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Force IndexedDB persistence (more reliable for WebView redirects)
// Falls back to localStorage if IndexedDB is unavailable
async function initializePersistence() {
  try {
    // Try IndexedDB first (most reliable for auth state across redirects)
    await setPersistence(auth, indexedDBLocalPersistence);
    console.log("✓ Firebase using IndexedDB persistence (optimal for WebView)");
  } catch (indexedDBError) {
    console.warn("IndexedDB persistence failed, falling back to localStorage:", indexedDBError);
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log("✓ Firebase using localStorage persistence");
    } catch (localStorageError) {
      console.error("❌ All persistence mechanisms failed:", localStorageError);
    }
  }
}

// Initialize persistence
initializePersistence();

// Diagnostic: Check if IndexedDB is accessible
if (typeof indexedDB !== "undefined") {
  console.log("✓ IndexedDB available in WebView");
} else {
  console.warn("⚠ IndexedDB NOT available - localStorage will be used as fallback");
}
