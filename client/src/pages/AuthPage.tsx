import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { ParentSettings } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
  });
  
  // Handle redirect result - check if user just signed in via redirect
  useEffect(() => {
    const checkRedirectResult = async () => {
      if (user && !authLoading) {
        try {
          const token = user.idToken;
          
          if (!token) {
            console.error("No ID token available");
            return;
          }
          
          // Check if parent settings already exist
          const response = await fetch("/api/parent-settings", {
            credentials: "include", // Send HTTP-only cookie
          });
          
          if (response.ok) {
            const settings = await response.json();
            // If they have a PIN and child name, they completed setup
            if (settings.pinHash && settings.childName) {
              setLocation("/dashboard");
            } else {
              // Not fully set up yet, go to setup
              setLocation("/setup");
            }
          } else if (response.status === 404) {
            // No settings, go to setup
            setLocation("/setup");
          } else {
            // Some other error, go to setup
            setLocation("/setup");
          }
        } catch (error) {
          console.error('Error checking parent settings:', error);
        }
      }
    };
    
    checkRedirectResult();
  }, [user, authLoading, setLocation]);
  
  const welcomeText = parentSettings?.childName 
    ? `Welcome to ${parentSettings.childName}`
    : "Welcome to TELL MAMMA";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // The popup will handle navigation after successful auth
      // No need to redirect here - let the auth state change trigger it
    } catch (error: any) {
      // Sign in failed
      console.error("Sign in error:", error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please contact support.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In is not enabled. Please contact support.';
      } else if (error.message.includes('initial state') || error.code === 'auth/missing-auth-event') {
        errorMessage = 'Storage issue detected. Please ensure third-party cookies are enabled or try a different browser.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="rounded-2xl text-sm sm:text-base"
            data-testid="button-back-home"
          >
            ← Back to Home
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-100px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Card className="w-full max-w-md mx-auto rounded-3xl border-2 text-card-foreground">
              <CardHeader className="text-center space-y-3 sm:space-y-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mx-auto"
                >
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto" />
                </motion.div>
                <CardTitle className="font-heading text-2xl sm:text-3xl text-white">{welcomeText}</CardTitle>
                <CardDescription className="text-sm sm:text-base px-2 text-white/80">
                  Sign in with Google to access magical bedtime stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button
                  onClick={handleGoogleSignIn}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl text-base sm:text-lg gap-3 bg-white text-gray-800 hover:bg-white/90"
                  disabled={loading}
                  data-testid="button-google-signin"
                >
                  <SiGoogle className="w-5 h-5" />
                  {loading ? "Signing in..." : "Continue with Google"}
                </Button>
                
                <p className="text-xs sm:text-sm text-center text-white/70 px-2 sm:px-4">
                  By signing in, you agree to create a safe, magical reading environment for your child
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
