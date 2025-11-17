import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDgqw5bnk2Y1oQpt_DmH1viUvyj6WztDok",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "story-7af93"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "story-7af93",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "story-7af93"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "443276932654",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:443276932654:web:250eb2d3aa0b8dbd5811bf",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3SSVFESQFX"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});
