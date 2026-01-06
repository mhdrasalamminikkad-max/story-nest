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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase auth state listener
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
            idToken: "", // Token is in HTTP-only cookie for web
            authentication: { idToken: "" },
          };
          setUser(googleUser);
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Listen for OAuth callback from deep link (native app)
    const setupOAuthListener = async () => {
      try {
        const { App } = await import("@capacitor/app");
        
        App.addListener("appUrlOpen", async (event: { url: string }) => {
          const url = event.url;
          
          // Handle OAuth callback with token in URL fragment
          if (url.includes("/setup") || url.includes("/dashboard")) {
            const hashPart = url.split("#")[1];
            if (hashPart) {
              const params = new URLSearchParams(hashPart);
              const token = params.get("token");
              const userJson = params.get("user");
              
              if (token && userJson) {
                try {
                  const userData = JSON.parse(decodeURIComponent(userJson));
                  
                  // Store token securely in Capacitor Preferences
                  const { Preferences } = await import("@capacitor/preferences");
                  await Preferences.set({
                    key: AUTH_TOKEN_KEY,
                    value: token,
                  });
                  await Preferences.set({
                    key: AUTH_USER_KEY,
                    value: JSON.stringify(userData),
                  });
                  
                  const googleUser: GoogleUser = {
                    id: userData.id,
                    email: userData.email,
                    displayName: userData.name || "",
                    photoUrl: userData.picture || "",
                    idToken: token,
                    authentication: { idToken: token },
                  };
                  
                  setUser(googleUser);
                } catch (e) {
                  console.error("Error processing OAuth callback:", e);
                }
              }
            }
          }
        });
      } catch (e) {
        console.log("App plugin not available (probably web)");
      }
    };
    
    checkSession();
    setupOAuthListener();
  }, []);

  const signInWithGoogle = async (): Promise<GoogleUser> => {
    setLoading(true);
    setError(null);
    
    try {
      const { Capacitor } = await import("@capacitor/core");
      
      if (Capacitor.isNativePlatform()) {
        // For native, use Firebase popup (works with Capacitor WebView)
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
        } catch (nativeError) {
          console.error("Native sign-in error:", nativeError);
          setLoading(false);
          throw nativeError;
        }
      }
    } catch (e) {
      console.log("Capacitor not available, using web auth");
    }

    // Web: Use Firebase popup
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
    } catch (webError) {
      const errorMessage = webError instanceof Error ? webError.message : "Sign-in failed";
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
        console.error("Error clearing preferences:", e);
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

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
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
