import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  idToken?: string;
  authentication?: {
    idToken: string;
  };
}

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<GoogleUser>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase auth state listener - handles automatic session restoration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const googleUser: GoogleUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoUrl: firebaseUser.photoURL || "",
          idToken: idToken,
          authentication: { idToken: idToken },
        };
        setUser(googleUser);
        
        // Store token in Capacitor Preferences for native app
        try {
          const { Preferences } = await import("@capacitor/preferences");
          await Preferences.set({
            key: "auth_token",
            value: idToken,
          });
          await Preferences.set({
            key: "auth_user",
            value: JSON.stringify(googleUser),
          });
        } catch (e) {
          console.log("Capacitor Preferences not available (probably web)");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<GoogleUser> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      const googleUser: GoogleUser = {
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoUrl: user.photoURL || "",
        idToken: idToken,
        authentication: { idToken: idToken },
      };
      
      setLoading(false);
      return googleUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sign-in failed";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear Capacitor Preferences for native app
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.remove({ key: "auth_token" });
        await Preferences.remove({ key: "auth_user" });
      } catch (e) {
        console.log("Capacitor Preferences not available (probably web)");
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign-out failed";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true); // Force refresh
        return token;
      }
      return null;
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
