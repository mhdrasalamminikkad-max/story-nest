import { AnimatedBackground } from "@/components/AnimatedBackground";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-100/30 to-background dark:from-background dark:via-purple-950/30 dark:to-background">
      <AnimatedBackground />
      
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
                {user && (
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    className="rounded-2xl font-semibold bg-[#febc2d] text-[#1a1c25] hover:bg-[#febc2d]/90 hover:shadow-lg transition-all"
                    data-testid="button-dashboard"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
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
                  <span className="text-[#F5C518] drop-shadow-2xl block" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 max-w-6xl mx-auto mb-16 sm:mb-32">
            {/* Explore Stories */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              whileHover={{ scale: 1.02, rotate: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: 0.1, type: "spring" }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full border-2 border-[#E5683A]/30 shadow-2xl bg-[#E5683A]"
                onClick={() => setLocation("/explore-stories")}
                data-testid="card-explore-stories"
              >
                {/* Animated Background Gradient */}
                {!prefersReducedMotion && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"
                  animate={{ 
                    background: [
                      "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)",
                      "linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)",
                      "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                )}
                
                {/* Decorative Blurs */}
                {!prefersReducedMotion && (
                <>
                <motion.div 
                  className="absolute -top-20 -right-20 w-64 h-64 bg-[#F5C518]/30 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"
                  animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                </>
                )}
                
                {/* Content */}
                <div className="relative p-10 sm:p-14 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px] sm:min-h-[450px]">
                  <motion.div
                    className="relative"
                    whileHover={!prefersReducedMotion ? { scale: 1.1, rotate: 15 } : {}}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {!prefersReducedMotion && (
                    <motion.div 
                      className="absolute inset-0 bg-[#F5C518]/40 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    )}
                    <motion.div 
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#F5C518] flex items-center justify-center shadow-2xl border-4 border-white/30"
                      animate={!prefersReducedMotion ? { y: [0, -12, 0] } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {!prefersReducedMotion ? (
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-gray-800" />
                      </motion.div>
                      ) : (
                      <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-gray-800" />
                      )}
                    </motion.div>
                  </motion.div>
                  
                  <div className="space-y-4">
                    <motion.h2 
                      className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      Explore Stories
                    </motion.h2>
                    <p className="text-base sm:text-lg text-white max-w-md mx-auto leading-relaxed font-medium">
                      Discover hundreds of magical tales across different languages, categories, and themes
                    </p>
                  </div>

                  <motion.div className="flex flex-wrap gap-3 justify-center pt-4">
                    {["Fairy Tales", "Adventures", "Educational"].map((tag, idx) => (
                      <motion.div
                        key={tag}
                        className="px-5 py-2 bg-[#F5C518] rounded-full text-sm font-bold text-gray-800 border-2 border-white/20 cursor-pointer shadow-lg"
                        whileHover={{ scale: 1.1, backgroundColor: "#fff", color: "#E5683A" }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        {tag}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Rhymes & Songs */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              whileHover={{ scale: 1.02, rotate: -1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: 0.2, type: "spring" }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full border-2 border-[#E5683A]/30 shadow-2xl bg-[#E5683A]"
                onClick={() => setLocation("/rhymes")}
                data-testid="card-rhymes"
              >
                {/* Animated Background Gradient */}
                {!prefersReducedMotion && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"
                  animate={{ 
                    background: [
                      "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)",
                      "linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)",
                      "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                )}
                
                {/* Decorative Blurs */}
                {!prefersReducedMotion && (
                <>
                <motion.div 
                  className="absolute -top-20 -right-20 w-64 h-64 bg-[#F5C518]/30 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                />
                <motion.div 
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"
                  animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                />
                </>
                )}
                
                {/* Content */}
                <div className="relative p-10 sm:p-14 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px] sm:min-h-[450px]">
                  <motion.div
                    className="relative"
                    whileHover={!prefersReducedMotion ? { scale: 1.1, rotate: -15 } : {}}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {!prefersReducedMotion && (
                    <motion.div 
                      className="absolute inset-0 bg-[#F5C518]/40 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                    )}
                    <motion.div 
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#F5C518] flex items-center justify-center shadow-2xl border-4 border-white/30"
                      animate={!prefersReducedMotion ? { y: [0, -12, 0] } : {}}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                    >
                      {!prefersReducedMotion ? (
                      <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <Music2 className="w-14 h-14 sm:w-16 sm:h-16 text-gray-800" />
                      </motion.div>
                      ) : (
                      <Music2 className="w-14 h-14 sm:w-16 sm:h-16 text-gray-800" />
                      )}
                    </motion.div>
                  </motion.div>
                  
                  <div className="space-y-4">
                    <motion.h2 
                      className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      Rhymes & Songs
                    </motion.h2>
                    <p className="text-base sm:text-lg text-white max-w-md mx-auto leading-relaxed font-medium">
                      Enjoy delightful nursery rhymes and songs that make learning fun and memorable
                    </p>
                  </div>

                  <motion.div className="flex flex-wrap gap-3 justify-center pt-4">
                    {["Nursery Rhymes", "Songs", "Music"].map((tag, idx) => (
                      <motion.div
                        key={tag}
                        className="px-5 py-2 bg-[#F5C518] rounded-full text-sm font-bold text-gray-800 border-2 border-white/20 cursor-pointer shadow-lg"
                        whileHover={{ scale: 1.1, backgroundColor: "#fff", color: "#E5683A" }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        {tag}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Why Choose TELL MAMMA */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 sm:mb-24"
          >
            <motion.h2 
              className="text-4xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 text-[#E5683A] drop-shadow-md"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Why Choose TELL MAMMA?
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { icon: BookOpen, title: "Rich Library", desc: "Hundreds of stories across fairy tales, adventures, and educational content" },
                { icon: Play, title: "Read Aloud", desc: "AI-powered voice narration brings every story to life with engaging audio" },
                { icon: Heart, title: "Safe & Fun", desc: "Parental controls and rewards that make learning enjoyable and memorable" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.6, delay: i * 0.15, type: "spring" }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 text-center space-y-6 h-full border-2 border-[#E5683A]/20 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm relative overflow-hidden group">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-[#F5C518]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <motion.div 
                      className="w-16 h-16 bg-[#F5C518] rounded-3xl flex items-center justify-center mx-auto shadow-lg relative z-10"
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    >
                      <feature.icon className="w-8 h-8 text-gray-800" />
                    </motion.div>
                    <h3 className="font-bold text-2xl text-black dark:text-white relative z-10">{feature.title}</h3>
                    <p className="text-black/70 dark:text-white/70 leading-relaxed font-medium relative z-10">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

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
