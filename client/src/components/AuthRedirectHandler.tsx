import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Handles redirect logic after Google OAuth authentication
 * Redirects to appropriate page based on whether parent settings exist
 */
export function AuthRedirectHandler() {
  const [location, setLocation] = useLocation();
  const { user, loading, getIdToken } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // User is authenticated and we're on the auth page
    if (user && location === "/auth") {
      // Check if parent settings exist
      getIdToken().then(async (token) => {
        if (!token) {
          setLocation("/setup");
          return;
        }

        try {
          const response = await fetch("/api/parent-settings", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Settings exist, go to dashboard
            setLocation("/dashboard");
          } else if (response.status === 404) {
            // No settings, go to setup
            setLocation("/setup");
          } else {
            // Some other error, go to setup
            setLocation("/setup");
          }
        } catch (error) {
          console.error("Error checking parent settings:", error);
          // On error, default to setup
          setLocation("/setup");
        }
      });
    }
  }, [user, loading, location, setLocation, getIdToken]);

  return null; // This component doesn't render anything
}
