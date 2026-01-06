import { createContext, useContext, useState, useEffect } from "react";
import { signInWithGoogle, signOutUser, onAuthStateChange, type AuthUser } from "../lib/firebase-auth";

export interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  idToken?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<GoogleUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      if (authUser) {
        const googleUser: GoogleUser = {
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName,
          photoUrl: authUser.photoUrl,
        };
        setUser(googleUser);
        localStorage.setItem("firebase_auth_user", JSON.stringify(googleUser));
      } else {
        setUser(null);
        localStorage.removeItem("firebase_auth_user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authUser = await signInWithGoogle();
      const googleUser: GoogleUser = {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
        photoUrl: authUser.photoUrl,
      };
      
      setUser(googleUser);
      localStorage.setItem("firebase_auth_user", JSON.stringify(googleUser));
      setLoading(false);
      return googleUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign-in failed";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signOutUser();
      setUser(null);
      localStorage.removeItem("firebase_auth_user");
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign-out failed";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle: handleSignInWithGoogle, signOut: handleSignOut }}>
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

