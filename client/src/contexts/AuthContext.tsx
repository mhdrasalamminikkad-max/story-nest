import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, getRedirectResult, signOut as firebaseSignOut, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result first (for compatibility with any existing redirects)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('✓ Sign in via redirect successful:', result.user.email);
          setUser(result.user);
        }
      })
      .catch((error) => {
        // Ignore redirect errors since we're primarily using popup
        if (error.code !== 'auth/no-auth-event') {
          console.error('Redirect sign in error (expected if using popup):', error.code, error.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Try to use Capacitor Browser on mobile
      try {
        const { Capacitor } = await import("@capacitor/core");
        const { Browser } = await import("@capacitor/browser");
        
        if (Capacitor.isNativePlatform()) {
          // Mobile: Use system browser
          const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_FIREBASE_API_KEY}&redirect_uri=https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/handler&response_type=code&scope=email%20profile&state=${Math.random().toString(36)}`;
          
          await Browser.open({ url: googleAuthUrl });
          
          // Wait for auth state to update
          return new Promise<User>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Auth timeout"));
            }, 60000);
            
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
              if (firebaseUser) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(firebaseUser);
              }
            });
          });
        }
      } catch (e) {
        console.log("Capacitor not available, using popup");
      }
      
      // Web: Use popup as primary method (more reliable than redirect)
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
