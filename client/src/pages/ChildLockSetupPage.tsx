import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Lock, Clock, Maximize } from "lucide-react";
import { useLocation } from "wouter";
import { insertParentSettingsSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ChildLockSetupPage() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [readingTime, setReadingTime] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Please sign in first",
        description: "You need to sign in before setting up child lock",
        variant: "destructive",
        duration: 3000,
      });
      setLocation("/auth");
    }
  }, [authLoading, user, setLocation, toast]);

  const form = useForm({
    resolver: zodResolver(insertParentSettingsSchema),
    defaultValues: {
      pin: "",
      parentName: "",
      childName: "",
      childAge: 5,
      readingTimeLimit: 30,
      fullscreenLockEnabled: true,
      theme: "day" as const,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📝 Submitting child lock settings:", data);
      
      const token = await getIdToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required - no token available");
      }
      
      console.log("✅ Token retrieved successfully (length: " + token.length + ")");
      console.log("🔑 Token preview:", token.substring(0, 50) + "..." + token.substring(token.length - 20));
      
      const res = await fetch("/api/parent-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      console.log("📡 Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ API Error response:", errorData);
        
        if (res.status === 401) {
          console.error("❌ 401 Unauthorized - Token rejected by server");
          console.error("Details:", errorData);
          throw new Error("Session expired - please sign in again");
        }
        throw new Error(errorData.message || errorData.details || "Failed to save settings");
      }
      return await res.json();
    },
    onSuccess: () => {
      console.log("Settings saved successfully");
      toast({
        title: "Success!",
        description: "Child lock settings saved successfully",
        duration: 3000,
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      console.error("❌ Failed to save settings:", error.message);
      const errorMessage = error.message;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="rounded-2xl text-purple-600 dark:text-purple-400"
            data-testid="button-back-home"
          >
            ← Back to Home
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <Card className="rounded-3xl border-2 text-card-foreground bg-white dark:bg-gray-900 border-white/20 shadow-2xl overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 pb-8">
                <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="font-heading text-3xl text-purple-600 dark:text-purple-400">Child Lock Setup</CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Configure safety settings for your child's reading time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-gray-900 dark:text-gray-100">
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Lock className="w-4 h-4" />
                            Parent PIN (4 digits)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="Enter 4-digit PIN"
                              className="text-center text-2xl tracking-widest rounded-2xl text-foreground bg-background border-2 border-input focus:border-purple-500 transition-colors"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                field.onChange(value);
                              }}
                              data-testid="input-setup-pin"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            This PIN will be required to exit child mode
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-gray-700 dark:text-gray-300">
                            Your Name (Parent)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your name"
                              className="rounded-2xl text-foreground bg-background border-2 border-input focus:border-purple-500 transition-colors"
                              {...field}
                              data-testid="input-parent-name"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            This helps personalize the experience
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="childName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-gray-700 dark:text-gray-300">
                            Child's Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your child's name"
                              className="rounded-2xl text-foreground bg-background border-2 border-input focus:border-purple-500 transition-colors"
                              {...field}
                              data-testid="input-child-name"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            This name will appear in welcome messages
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="childAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-gray-700 dark:text-gray-300">
                            Child's Age
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="18"
                              placeholder="Enter child's age (1-18)"
                              className="rounded-2xl text-foreground bg-background border-2 border-input focus:border-purple-500 transition-colors"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-child-age"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Child's age for age-appropriate content selection
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="readingTimeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base flex items-center gap-2 justify-between text-gray-700 dark:text-gray-300">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Reading Time Limit
                            </span>
                            <span className="font-heading text-purple-600 dark:text-purple-400 font-bold">{field.value} minutes</span>
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={10}
                              max={60}
                              step={5}
                              value={[field.value]}
                              onValueChange={(value) => {
                                field.onChange(value[0]);
                                setReadingTime(value[0]);
                              }}
                              className="py-4"
                              data-testid="slider-reading-time"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Maximum reading time per session (10-60 minutes)
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullscreenLockEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 border-purple-100 dark:border-purple-900 p-6 bg-purple-50/50 dark:bg-purple-900/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Maximize className="w-4 h-4" />
                              Enable Fullscreen Lock
                            </FormLabel>
                            <FormDescription className="text-gray-500 dark:text-gray-400">
                              Prevent accidental exits during story time
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-fullscreen-lock"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-2xl text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
                      disabled={saveMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Settings & Continue"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
