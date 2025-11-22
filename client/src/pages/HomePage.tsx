import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, LogIn, User, Play, Music2 } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-xl transition-all"
                onClick={() => setLocation("/")}
                data-testid="button-home-logo"
              >
                <BookOpen className="w-6 h-6 text-primary" />
                <h1 className="font-heading text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  StoryNest
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setLocation("/dashboard")}
                      className="rounded-xl"
                      data-testid="button-dashboard"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                    <Button
                      onClick={() => setLocation("/child-mode")}
                      className="rounded-xl"
                      data-testid="button-child-mode"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Child Mode</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setLocation("/auth")}
                    className="rounded-xl"
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
        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Welcome to StoryNest</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Magical Bedtime Stories
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Create wonderful memories with enchanting tales that inspire imagination and sweet dreams
              </p>
            </motion.div>
          </div>

          {/* Two Big Boxes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Explore Stories Box */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full"
                onClick={() => setLocation("/explore-stories")}
                data-testid="card-explore-stories"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30" />
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-400/30 to-purple-400/30 rounded-full blur-3xl" />
                
                {/* Content */}
                <div className="relative p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] sm:min-h-[400px]">
                  <motion.div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Explore Stories
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-md">
                      Discover hundreds of magical tales across different languages, categories, and themes
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-3 py-1 bg-purple-500/10 dark:bg-purple-500/20 rounded-full text-sm font-medium text-purple-700 dark:text-purple-300">
                      Fairy Tales
                    </div>
                    <div className="px-3 py-1 bg-pink-500/10 dark:bg-pink-500/20 rounded-full text-sm font-medium text-pink-700 dark:text-pink-300">
                      Adventures
                    </div>
                    <div className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300">
                      Educational
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg mt-4"
                    data-testid="button-start-exploring"
                  >
                    Start Exploring
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Rhymes Box */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all h-full"
                onClick={() => setLocation("/rhymes")}
                data-testid="card-rhymes"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-teal-500/20 to-green-500/20 dark:from-blue-900/30 dark:via-teal-900/30 dark:to-green-900/30" />
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-teal-400/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-400/30 to-blue-400/30 rounded-full blur-3xl" />
                
                {/* Content */}
                <div className="relative p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] sm:min-h-[400px]">
                  <motion.div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                      Rhymes
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-md">
                      Enjoy delightful nursery rhymes and songs that make learning fun and memorable
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300">
                      Nursery Rhymes
                    </div>
                    <div className="px-3 py-1 bg-teal-500/10 dark:bg-teal-500/20 rounded-full text-sm font-medium text-teal-700 dark:text-teal-300">
                      Songs
                    </div>
                    <div className="px-3 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full text-sm font-medium text-green-700 dark:text-green-300">
                      Music
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg mt-4"
                    data-testid="button-discover-rhymes"
                  >
                    Discover Rhymes
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 sm:mt-24"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
              Why Choose StoryNest?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Rich Library</h3>
                <p className="text-sm text-muted-foreground">
                  Hundreds of stories across fairy tales, adventures, and educational content
                </p>
              </Card>

              <Card className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-pink-500/10 dark:bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-lg">Read Aloud</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered voice narration brings every story to life with engaging audio
                </p>
              </Card>

              <Card className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Music2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg">Rewards System</h3>
                <p className="text-sm text-muted-foreground">
                  Motivate reading with checkpoints and rewards that make learning fun
                </p>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
