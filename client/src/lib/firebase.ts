import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

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

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});
