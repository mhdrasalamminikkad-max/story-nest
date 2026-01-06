import { createContext, useContext, useState, useEffect } from "react";
import { GOOGLE_OAUTH_CONFIG } from "@/lib/google-oauth";

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

// Store user in sessionStorage (cleared when browser closes)
const STORAGE_KEY = "google_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has active session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Also listen for deep link from OAuth redirect
        const { App } = await import("@capacitor/app");
        
        App.addListener("appUrlOpen", async (event: any) => {
          const url = event.url;
          
          // Handle OAuth callback redirect
          if (url.includes("api/auth/callback")) {
            // User is being redirected back from OAuth
            // Session will be established via the /api/auth/me endpoint below
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Re-check session
            try {
              const response = await fetch("/api/auth/me", {
                credentials: "include", // Send HTTP-only cookies
              });
              if (response.ok) {
                const data = await response.json();
                const googleUser: GoogleUser = {
                  id: data.id,
                  email: data.email,
                  displayName: data.name || "",
                  photoUrl: data.picture || "",
                  idToken: "",
                  authentication: { idToken: "" },
                };
                setUser(googleUser);
              }
            } catch (err) {
              console.error("Error checking session after OAuth:", err);
            }
          }
        });
      } catch (e) {
        // App plugin not available (probably web)
      }
      
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Send HTTP-only cookies for persistent login
        });
        
        if (response.ok) {
          const data = await response.json();
          const googleUser: GoogleUser = {
            id: data.id,
            email: data.email,
            displayName: data.name || "",
            photoUrl: data.picture || "",
            idToken: "", // Token is in HTTP-only cookie
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
    
    checkSession();
  }, []);

  // Handle OAuth callback from server redirect
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we just returned from OAuth (redirected to dashboard)
      if (window.location.pathname === "/dashboard" && !user) {
        // Give the session check time to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry session check
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include", // Send HTTP-only cookies
          });
          if (response.ok) {
            const data = await response.json();
            const googleUser: GoogleUser = {
              id: data.id,
              email: data.email,
              displayName: data.name || "",
              photoUrl: data.picture || "",
              idToken: "",
              authentication: { idToken: "" },
            };
            setUser(googleUser);
          }
        } catch (err) {
          console.error("OAuth callback session check error:", err);
        }
      }
    };
    
    handleOAuthCallback();
  }, [user]);

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
              authentication: result.authentication as { idToken: string } | undefined,
            };
            
            setUser(googleUser);
            setLoading(false);
            return googleUser;
          }
          throw new Error("Sign-in failed - no result");
        } catch (nativeError) {
          console.error("Native sign-in error:", nativeError);
          setLoading(false);
          throw nativeError;
        }
      }
    } catch (e) {
      console.log("Capacitor not available");
    }

    // Web/Capacitor: Google OAuth with proper browser handling
    try {
      const { Capacitor } = await import("@capacitor/core");
      const { Browser } = await import("@capacitor/browser");
      
      const clientId = GOOGLE_OAUTH_CONFIG.clientId;
      const scope = GOOGLE_OAUTH_CONFIG.scope;
      const redirectUri = GOOGLE_OAUTH_CONFIG.redirectUri;
      
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem("oauth_state", state);
      
      const authUrl = new URL(GOOGLE_OAUTH_CONFIG.authUri);
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scope);
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "online");
      
      // Use Capacitor Browser for native and web
      if (Capacitor.isNativePlatform()) {
        // For native apps, open in Capacitor Browser (stays in app)
        await Browser.open({ url: authUrl.toString() });
      } else {
        // For web, use window.location
        window.location.href = authUrl.toString();
      }
      
      // Return a promise that never resolves as we are redirecting
      return new Promise<GoogleUser>(() => {});
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
      
      // Call server logout to clear HTTP-only cookie
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout error:", err);
      }
      
      setUser(null);
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
