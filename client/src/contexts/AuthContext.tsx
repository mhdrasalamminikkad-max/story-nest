import { createContext, useContext, useState } from "react";

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

// Store user in localStorage for persistence
const STORAGE_KEY = "google_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async (): Promise<GoogleUser> => {
    setLoading(true);
    setError(null);
    
    try {
      const { Capacitor } = await import("@capacitor/core");
      
      if (Capacitor.isNativePlatform()) {
        try {
          const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
          const result = await GoogleAuth.signIn();
          
          if (result) {
            const googleUser: GoogleUser = {
              id: result.id,
              email: result.email,
              displayName: result.displayName || "",
              photoUrl: result.imageUrl || "",
              idToken: result.authentication?.idToken || "",
            };
            
            setUser(googleUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
            setLoading(false);
            return googleUser;
          }
        } catch (nativeError) {
          console.error("Native sign-in error:", nativeError);
        }
      }
    } catch (e) {
      console.log("Capacitor not available");
    }
    
    // Web: Google OAuth popup fallback
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const scope = "openid profile email";
      const redirectUri = `${window.location.origin}/`;
      
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem("oauth_state", state);
      
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scope);
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "online");
      
      window.location.href = authUrl.toString();
      
      // We need to return a promise that won't resolve because we're redirecting
      return new Promise(() => {});
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
      const { Capacitor } = await import("@capacitor/core");
      
      if (Capacitor.isNativePlatform()) {
        try {
          // Call native sign-out
          await (window as any).GoogleSignInPlugin?.signOut();
        } catch (e) {
          console.error("Native sign-out error:", e);
        }
      }
      
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
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
