import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { FIREBASE_CONFIG } from "./google-oauth-config";

// Validate Firebase config before initializing
if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
  console.error("❌ Firebase configuration is missing. Please check your environment variables.", FIREBASE_CONFIG);
  throw new Error("Firebase configuration is incomplete. Missing apiKey or projectId.");
}

console.log("🔧 Initializing Firebase with config:", {
  projectId: FIREBASE_CONFIG.projectId,
  authDomain: FIREBASE_CONFIG.authDomain,
  appId: FIREBASE_CONFIG.appId,
});

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
console.log("✅ Firebase Auth initialized");

// Initialize Analytics
try {
  const analytics = getAnalytics(app);
  console.log("✅ Firebase Analytics initialized");
} catch (error) {
  console.warn("⚠️ Firebase Analytics initialization failed (this is okay in development):", error);
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

// Convert Firebase User to AuthUser
const convertFirebaseUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoUrl: user.photoURL || undefined,
  };
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = convertFirebaseUser(result.user);
    if (!user) throw new Error("Failed to get user data");
    return user;
  } catch (error) {
    throw new Error(`Google sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(`Sign-out failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Get current user
export const getCurrentUser = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(convertFirebaseUser(user));
    });
  });
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(convertFirebaseUser(user));
  });
};

// Get ID Token for API requests
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return null;
  }
};
