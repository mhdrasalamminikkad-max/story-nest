import { createContext, useContext, useState, useEffect } from "react";
import { GOOGLE_OAUTH_CONFIG, getRedirectUri } from "@/lib/google-oauth";

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store user in localStorage for persistence
const STORAGE_KEY = "google_auth_user";
const ID_TOKEN_KEY = "google_id_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");
      const idToken = urlParams.get("id_token"); // Token passed from server redirect

      if (error) {
        setError(`Authentication failed: ${error}`);
        setLoading(false);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (code && state && idToken) {
        setLoading(true);
        try {
          // Verify state
          const storedState = sessionStorage.getItem("oauth_state");
          if (!storedState || storedState !== state) {
            throw new Error("Invalid state parameter");
          }

          // Verify the ID token by decoding it (basic verification)
          // The server already verified it, so we can trust it here
          const tokenParts = idToken.split('.');
          if (tokenParts.length !== 3) {
            throw new Error("Invalid token format");
          }

          // Decode token payload (without verification since server already verified)
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Store user and token
          const googleUser: GoogleUser = {
            id: payload.sub,
            email: payload.email,
            displayName: payload.name,
            photoUrl: payload.picture,
            idToken: idToken,
          };

          setUser(googleUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
          localStorage.setItem(ID_TOKEN_KEY, idToken);

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem("oauth_state");

          // Force check for settings and redirect
          const settingsResponse = await fetch("/api/parent-settings", {
            headers: {
              "Authorization": `Bearer ${idToken}`
            }
          });

          if (settingsResponse.ok) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/setup";
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Authentication failed";
          setError(errorMessage);
          console.error("OAuth callback error:", err);
        } finally {
          setLoading(false);
        }
      } else if (code && state) {
        // Fallback: Exchange code via POST if id_token not in URL
        setLoading(true);
        try {
          const storedState = sessionStorage.getItem("oauth_state");
          if (!storedState || storedState !== state) {
            throw new Error("Invalid state parameter");
          }

          const response = await fetch("/api/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Authentication failed");
          }

          const data = await response.json();
          
          const googleUser: GoogleUser = {
            id: data.user.sub,
            email: data.user.email,
            displayName: data.user.name,
            photoUrl: data.user.picture,
            idToken: data.idToken,
          };

          setUser(googleUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
          localStorage.setItem(ID_TOKEN_KEY, data.idToken);

          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem("oauth_state");

          // Force check for settings and redirect
          const settingsResponse = await fetch("/api/parent-settings", {
            headers: {
              "Authorization": `Bearer ${data.idToken}`
            }
          });

          if (settingsResponse.ok) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/setup";
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Authentication failed";
          setError(errorMessage);
          console.error("OAuth callback error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkOAuthCallback();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { Capacitor } = await import("@capacitor/core");
      
      if (Capacitor.isNativePlatform()) {
        // Native Android: Use custom Google Sign-In plugin
        try {
          const result = await (window as any).GoogleSignInPlugin?.signInWithGoogle({
            clientId: GOOGLE_OAUTH_CONFIG.clientId,
          });
          
          if (result) {
            const googleUser: GoogleUser = {
              id: result.id,
              email: result.email,
              displayName: result.displayName,
              photoUrl: result.photoUrl,
              idToken: result.idToken,
            };
            
            setUser(googleUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
            if (result.idToken) {
              localStorage.setItem(ID_TOKEN_KEY, result.idToken);
            }
            setLoading(false);
            return;
          }
        } catch (nativeError) {
          console.log("Native sign-in error:", nativeError);
        }
      }
    } catch (e) {
      console.log("Capacitor not available");
    }
    
    // Web: Google OAuth redirect
    try {
      const scope = "openid profile email";
      const redirectUri = getRedirectUri();
      
      // Generate random state for security
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("oauth_state", state);
      
      const authUrl = new URL(GOOGLE_OAUTH_CONFIG.authUri);
      authUrl.searchParams.append("client_id", GOOGLE_OAUTH_CONFIG.clientId);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", scope);
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "online");
      authUrl.searchParams.append("prompt", "select_account");
      
      // Redirect to Google
      window.location.href = authUrl.toString();
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
          await (window as any).GoogleSignInPlugin?.signOut();
        } catch (e) {
          console.error("Native sign-out error:", e);
        }
      }
      
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ID_TOKEN_KEY);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign-out failed";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    const token = localStorage.getItem(ID_TOKEN_KEY);
    return token;
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
