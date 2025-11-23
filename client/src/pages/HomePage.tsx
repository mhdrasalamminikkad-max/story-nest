import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, LogIn, User, Play, Music2, Sparkles, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { ParentSettings } from "@shared/schema";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
  });
  
  const welcomeText = parentSettings?.childName 
    ? `Welcome, ${parentSettings.childName}!`
    : "Welcome to StoryNest!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-100/30 to-background dark:from-background dark:via-purple-950/30 dark:to-background">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-background/90 to-background/80 dark:from-background/90 dark:to-background/80 backdrop-blur-xl border-b border-primary/10">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <motion.div 
                className="flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2 px-4 py-2 rounded-2xl transition-all bg-gradient-to-r from-primary/10 to-secondary/10"
                onClick={() => setLocation("/")}
                data-testid="button-home-logo"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <BookOpen className="w-7 h-7 text-primary" />
                </motion.div>
                <h1 className="font-heading text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  StoryNest
                </h1>
              </motion.div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                      className="rounded-2xl font-semibold"
                      data-testid="button-dashboard"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                    <Button
                      onClick={() => setLocation("/child-mode")}
                      className="rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
                      data-testid="button-child-mode"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Child Mode</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setLocation("/auth")}
                    className="rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
                    data-testid="button-sign-in"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
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
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/20 to-secondary/20 px-8 py-4 rounded-3xl border-2 border-primary/30 shadow-xl"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </motion.div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{welcomeText}</span>
              </motion.div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-heading font-black leading-tight">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-2xl block">
                    Magical Bedtime
                  </span>
                  <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent drop-shadow-2xl block">
                    Stories
                  </span>
                </h1>
              </div>

              {/* Subheading */}
              <p className="text-xl sm:text-2xl lg:text-3xl text-foreground/85 max-w-4xl mx-auto font-semibold leading-relaxed">
                Where imagination comes alive! Create wonderful memories with enchanting tales that inspire dreams and spark joy.
              </p>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 max-w-6xl mx-auto mb-16 sm:mb-32">
            {/* Explore Stories */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full border-2 border-primary/20 shadow-xl"
                onClick={() => setLocation("/explore-stories")}
                data-testid="card-explore-stories"
              >
                {/* Animated Background Gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                {/* Decorative Blurs */}
                <motion.div 
                  className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl"
                  animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-secondary/20 to-accent/20 rounded-full blur-3xl"
                  animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                
                {/* Content */}
                <div className="relative p-10 sm:p-14 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px] sm:min-h-[450px]">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Explore Stories
                    </h2>
                    <p className="text-base sm:text-lg text-foreground/70 max-w-md mx-auto leading-relaxed">
                      Discover hundreds of magical tales across different languages, categories, and themes
                    </p>
                  </div>

                  <motion.div className="flex flex-wrap gap-3 justify-center pt-4">
                    {["Fairy Tales", "Adventures", "Educational"].map((tag, idx) => (
                      <motion.div
                        key={tag}
                        className="px-5 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full text-sm font-bold text-primary dark:text-primary/80 border border-primary/30 cursor-pointer"
                        whileHover={{ scale: 1.15, boxShadow: "0 0 20px rgba(139, 92, 246, 0.6)" }}
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
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full border-2 border-secondary/20 shadow-xl"
                onClick={() => setLocation("/rhymes")}
                data-testid="card-rhymes"
              >
                {/* Animated Background Gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-accent/10 to-transparent"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                
                {/* Decorative Blurs */}
                <motion.div 
                  className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-3xl"
                  animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                />
                <motion.div 
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl"
                  animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                />
                
                {/* Content */}
                <div className="relative p-10 sm:p-14 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px] sm:min-h-[450px]">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.15, rotate: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-secondary to-accent rounded-full blur-2xl opacity-50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                    <motion.div 
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-2xl"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    >
                      <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <Music2 className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                      Rhymes & Songs
                    </h2>
                    <p className="text-base sm:text-lg text-foreground/70 max-w-md mx-auto leading-relaxed">
                      Enjoy delightful nursery rhymes and songs that make learning fun and memorable
                    </p>
                  </div>

                  <motion.div className="flex flex-wrap gap-3 justify-center pt-4">
                    {["Nursery Rhymes", "Songs", "Music"].map((tag, idx) => (
                      <motion.div
                        key={tag}
                        className="px-5 py-2 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full text-sm font-bold text-secondary dark:text-secondary/80 border border-secondary/30 cursor-pointer"
                        whileHover={{ scale: 1.15, boxShadow: "0 0 20px rgba(249, 115, 22, 0.6)" }}
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

          {/* Why Choose StoryNest */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-16 sm:mb-24"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Why Choose StoryNest?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { icon: BookOpen, title: "Rich Library", desc: "Hundreds of stories across fairy tales, adventures, and educational content", color: "from-primary to-purple-500" },
                { icon: Play, title: "Read Aloud", desc: "AI-powered voice narration brings every story to life with engaging audio", color: "from-secondary to-orange-500" },
                { icon: Heart, title: "Safe & Fun", desc: "Parental controls and rewards that make learning enjoyable and memorable", color: "from-accent to-red-500" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 text-center space-y-6 h-full border-2 border-primary/10 hover-elevate transition-all">
                    <motion.div 
                      className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mx-auto shadow-lg`}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-2xl">{feature.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
