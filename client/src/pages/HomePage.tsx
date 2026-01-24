import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, User, Play, Music2, Sparkles, Heart, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { ParentSettings } from "@shared/schema";
import tellMammaLogo from "@assets/logo_transparent.png";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
  });

  const welcomeText = parentSettings?.childName
    ? `Welcome, ${parentSettings.childName}!`
    : "Welcome to TELL MAMMA!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-100/30 to-background dark:from-background dark:via-purple-950/30 dark:to-background overflow-hidden">
      <AnimatedBackground />

      {/* Floating Stars */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 z-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Moving Clouds */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`cloud-${i}`}
              className="absolute text-white/20 dark:text-white/15 text-6xl"
              style={{
                top: `${20 + i * 25}%`,
              }}
              animate={{
                x: [-200, window.innerWidth + 200],
              }}
              transition={{
                duration: 40 + i * 15,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              ☁️
            </motion.div>
          ))}
        </div>
      )}

      {/* Big Moon */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute top-10 right-10 z-0 text-yellow-200 text-9xl opacity-40 dark:opacity-50"
          animate={{
            y: [0, 20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🌙
        </motion.div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-background/90 to-background/80 dark:from-background/90 dark:to-background/80 backdrop-blur-xl border-b border-primary/10">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <motion.div
                className="cursor-pointer hover-elevate active-elevate-2 rounded-2xl transition-all"
                onClick={() => setLocation("/")}
                data-testid="button-home-logo"
              >
                <img
                  src={tellMammaLogo}
                  alt="TELL MAMMA"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </motion.div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                {user ? (
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    className="rounded-2xl font-semibold bg-[#febc2d] text-[#1a1c25] hover:bg-[#febc2d]/90 hover:shadow-lg transition-all"
                    data-testid="button-dashboard"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLocation("/auth")}
                    className="rounded-2xl font-semibold bg-[#febc2d] text-[#1a1c25] hover:bg-[#febc2d]/90 hover:shadow-lg transition-all"
                    data-testid="button-signin"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-32 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-3 bg-[#F5C518]/20 px-8 py-4 rounded-3xl border-2 border-[#F5C518]/50 shadow-xl hover-elevate"
              >
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-6 h-6 text-[#E5683A] animate-pulse" />
                </motion.div>
                <span className="text-lg font-bold text-[#E5683A]">{welcomeText}</span>
              </motion.div>

              {/* Main Heading */}
              <div className="space-y-4">
                <motion.h1
                  className="text-6xl sm:text-7xl lg:text-8xl font-heading font-black leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <span className="text-[#E5683A] drop-shadow-2xl block">
                    Magical Bedtime
                  </span>
                  <span className="text-[#F5C518] drop-shadow-2xl block" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Stories
                  </span>
                </motion.h1>
              </div>

              {/* Subheading */}
              <motion.p
                className="text-xl sm:text-2xl lg:text-3xl text-black dark:text-white max-w-4xl mx-auto font-semibold leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                Where imagination comes alive! Create wonderful memories with enchanting tales that inspire dreams and spark joy.
              </motion.p>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16 sm:mb-32">
            {/* Explore Stories */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.1, type: "spring", stiffness: 300 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer transition-all h-full border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-[#FF8A65] via-[#E5683A] to-[#D1533A] rounded-3xl sm:rounded-4xl"
                onClick={() => setLocation("/explore-stories")}
                data-testid="card-explore-stories"
              >
                {/* Animated Background */}
                {!prefersReducedMotion && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -top-32 -right-32 w-80 h-80 bg-[#F5C518]/20 rounded-full blur-3xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                      animate={{ scale: [1.3, 1, 1.3] }}
                      transition={{ duration: 8, repeat: Infinity }}
                    />
                  </>
                )}

                {/* Content */}
                <div className="relative p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] sm:min-h-[400px]">
                  {/* Icon */}
                  <motion.div
                    className="relative"
                    whileHover={!prefersReducedMotion ? { scale: 1.15, rotate: 8 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {!prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 bg-[#F5C518]/30 rounded-full blur-2xl"
                        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}
                    <motion.div
                      className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[#F5C518] flex items-center justify-center shadow-xl border-4 border-white/40 backdrop-blur-sm"
                      animate={!prefersReducedMotion ? { y: [0, -10, 0] } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {!prefersReducedMotion ? (
                        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
                          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-[#E5683A]" />
                        </motion.div>
                      ) : (
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-[#E5683A]" />
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Text */}
                  <div className="space-y-3 sm:space-y-4">
                    <motion.h2
                      className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white drop-shadow-lg leading-tight"
                      whileHover={{ scale: 1.05 }}
                    >
                      Explore Stories
                    </motion.h2>
                    <p className="text-sm sm:text-base text-white/90 max-w-xs mx-auto leading-relaxed font-medium">
                      Discover magical tales and wonderful adventures
                    </p>
                  </div>

                  {/* Button */}
                  <motion.div
                    className="pt-2 sm:pt-4"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="px-6 sm:px-8 py-2 sm:py-3 bg-[#F5C518] text-[#E5683A] font-bold rounded-full text-sm sm:text-base shadow-lg hover:shadow-xl transition-shadow">
                      Start Reading ✨
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Explore Rhymes */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2, type: "spring", stiffness: 300 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer transition-all h-full border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-[#FFD54F] via-[#F5C518] to-[#FFC107] rounded-3xl sm:rounded-4xl"
                onClick={() => setLocation("/rhymes")}
                data-testid="card-rhymes"
              >
                {/* Animated Background */}
                {!prefersReducedMotion && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div
                      className="absolute -top-32 -right-32 w-80 h-80 bg-[#E5683A]/20 rounded-full blur-3xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div
                      className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                      animate={{ scale: [1.3, 1, 1.3] }}
                      transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}

                {/* Content */}
                <div className="relative p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] sm:min-h-[400px]">
                  {/* Icon */}
                  <motion.div
                    className="relative"
                    whileHover={!prefersReducedMotion ? { scale: 1.15, rotate: -8 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {!prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 bg-[#E5683A]/30 rounded-full blur-2xl"
                        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      />
                    )}
                    <motion.div
                      className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[#E5683A] flex items-center justify-center shadow-xl border-4 border-white/40 backdrop-blur-sm"
                      animate={!prefersReducedMotion ? { y: [0, -10, 0] } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                      {!prefersReducedMotion ? (
                        <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
                          <Music2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#F5C518]" />
                        </motion.div>
                      ) : (
                        <Music2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#F5C518]" />
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Text */}
                  <div className="space-y-3 sm:space-y-4">
                    <motion.h2
                      className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-gray-900 drop-shadow-lg leading-tight"
                      whileHover={{ scale: 1.05 }}
                    >
                      Explore Rhymes
                    </motion.h2>
                    <p className="text-sm sm:text-base text-gray-800 max-w-xs mx-auto leading-relaxed font-medium">
                      Enjoy delightful rhymes and enchanting melodies
                    </p>
                  </div>

                  {/* Button */}
                  <motion.div
                    className="pt-2 sm:pt-4"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="px-6 sm:px-8 py-2 sm:py-3 bg-[#E5683A] text-[#F5C518] font-bold rounded-full text-sm sm:text-base shadow-lg hover:shadow-xl transition-shadow">
                      Start Singing 🎵
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </div>



          {/* Footer */}
          <footer className="mt-20 sm:mt-28 pt-12 sm:pt-16 border-t border-foreground/10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center pb-8 sm:pb-12"
            >
              <p className="text-sm text-black/50 dark:text-white/50">
                Powered by Caliph Life School
              </p>
            </motion.div>
          </footer>
        </main>
      </div>
    </div>
  );
}
