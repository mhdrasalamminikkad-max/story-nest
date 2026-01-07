import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAi4MmMyAy3DXNV0HWkYx9G7aw415EJK2k",
  authDomain: "tellmamma.firebaseapp.com",
  projectId: "tellmamma",
  storageBucket: "tellmamma.firebasestorage.app",
  messagingSenderId: "820379114528",
  appId: "1:820379114528:web:479b678dfcc7ecaab07045",
  measurementId: "G-GPLM6TS2T7"
};

// Singleton pattern for Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export { app };
export const auth = getAuth(app);

// Force IndexedDB persistence (more reliable for WebView redirects)
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
