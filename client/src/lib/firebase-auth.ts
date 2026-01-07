import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

console.log("✅ Firebase Auth loaded from shared instance");

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
  } catch (error: any) {
    console.error("Full Firebase Auth Error:", error);
    // Include original error info for better UI handling
    throw error;
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
