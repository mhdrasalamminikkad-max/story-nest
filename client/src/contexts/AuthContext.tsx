import React, { createContext, useContext, useState, useEffect } from "react";
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

// Storage keys for secure token storage
const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has active session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First try to restore from Capacitor Storage (native app)
        try {
          const { Preferences } = await import("@capacitor/preferences");
          const { value: storedToken } = await Preferences.get({ key: AUTH_TOKEN_KEY });
          const { value: storedUser } = await Preferences.get({ key: AUTH_USER_KEY });
          
          if (storedToken && storedUser) {
            // Validate token with server before restoring session
            const response = await fetch("/api/auth/me", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${storedToken}`
              }
            });
            
            if (response.ok) {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setLoading(false);
              return;
            } else {
              // Token is invalid, clear storage
              const { Preferences } = await import("@capacitor/preferences");
              await Preferences.remove({ key: AUTH_TOKEN_KEY });
              await Preferences.remove({ key: AUTH_USER_KEY });
            }
          }
        } catch (e) {
          console.log("Capacitor Preferences not available (probably web)");
        }
        
        // For web apps, use fetch with HTTP-only cookies
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
        try {
          const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
          const result = await GoogleAuth.signIn() as any;
          
          if (result && result.id) {
            const googleUser: GoogleUser = {
              id: result.id,
              email: result.email || "",
              displayName: result.displayName || "",
              photoUrl: result.imageUrl || "",
              idToken: result.authentication?.idToken || "",
              authentication: result.authentication ? { idToken: result.authentication.idToken } : undefined,
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
      console.log("Capacitor not available, falling back to web OAuth");
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
          // Clear secure token storage for native apps
          const { Preferences } = await import("@capacitor/preferences");
          await Preferences.remove({ key: AUTH_TOKEN_KEY });
          await Preferences.remove({ key: AUTH_USER_KEY });
        } catch (e) {
          console.error("Error clearing native storage:", e);
        }
        
        try {
          // Call native sign-out
          await (window as any).GoogleSignInPlugin?.signOut();
        } catch (e) {
          console.error("Native sign-out error:", e);
        }
      }
      
      // Call server logout to clear HTTP-only cookie (for web)
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
