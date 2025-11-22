import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { ParentSettings } from "@shared/schema";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
  });
  
  const welcomeText = parentSettings?.childName 
    ? `Welcome to ${parentSettings.childName}`
    : "Welcome to StoryNest";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Ensure we have a valid token before proceeding
      if (user) {
        const token = await user.getIdToken(true);
        
        // Check if parent settings already exist
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
          // Some other error
          setLocation("/setup");
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
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
            <Card className="w-full max-w-md mx-auto rounded-3xl border-2">
              <CardHeader className="text-center space-y-3 sm:space-y-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mx-auto"
                >
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto" />
                </motion.div>
                <CardTitle className="font-heading text-2xl sm:text-3xl">{welcomeText}</CardTitle>
                <CardDescription className="text-sm sm:text-base px-2">
                  Sign in with Google to access magical bedtime stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGoogleSignIn}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl text-base sm:text-lg gap-3"
                  disabled={loading}
                  data-testid="button-google-signin"
                >
                  <SiGoogle className="w-5 h-5" />
                  {loading ? "Signing in..." : "Continue with Google"}
                </Button>
                
                <p className="text-xs sm:text-sm text-center text-muted-foreground px-2 sm:px-4">
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
