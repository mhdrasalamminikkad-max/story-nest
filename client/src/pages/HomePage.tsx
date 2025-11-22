import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Sparkles, Play, Clock, TrendingUp, Star, BookOpen, Target, Search, LogIn, User } from "lucide-react";
import { useLocation } from "wouter";
import { HorizontalStoryCarousel } from "@/components/HorizontalStoryCarousel";
import { CategoryChips } from "@/components/CategoryChips";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories/preview"],
  });

  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
  });

  const categories = ["All", "Fairy Tale", "Adventure", "Educational", "Moral", "History"];

  const allStories = stories;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const categoryMap: Record<string, string[]> = {
    "All": [],
    "Fairy Tale": ["fairy-tale"],
    "Adventure": ["adventure"],
    "Educational": ["educational"],
    "Moral": ["moral"],
    "History": ["history"],
  };

  const filteredStories = allStories.filter((story) => {
    const categoryValues = categoryMap[selectedCategory] || [];
    const matchesCategory = selectedCategory === "All" || 
      categoryValues.some(cat => story.category.toLowerCase() === cat.toLowerCase());
    
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.summary && story.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-6 py-4">
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

              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search magical stories..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                    data-testid="input-search-desktop"
                  />
                </div>
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
                      Dashboard
                    </Button>
                    <Button
                      onClick={() => setLocation("/child-mode")}
                      className="rounded-xl"
                      data-testid="button-child-mode"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Child Mode
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

        {/* Mobile Header */}
        <MobileHeader showSearch onSearch={handleSearch} />
        
        <main className="px-0 pt-2">
          {/* Hero Section - Desktop Only */}
          <div className="hidden md:block container mx-auto px-6 py-12 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4" data-testid="badge-welcome">
                <Sparkles className="w-3 h-3 mr-1" />
                {parentSettings?.childName ? `Welcome ${parentSettings.childName}` : 'Welcome to StoryNest'}
              </Badge>
              <h2 className="font-heading text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                Magical Bedtime Stories
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create wonderful memories with enchanting tales that inspire imagination and sweet dreams
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => user ? setLocation("/child-mode") : setLocation("/auth")}
                  className="rounded-2xl text-lg px-8"
                  data-testid="button-start-reading"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Reading
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/stories")}
                  className="rounded-2xl text-lg px-8"
                  data-testid="button-browse-stories"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse Stories
                </Button>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            >
              <Card className="p-6 rounded-2xl text-center hover-elevate">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">Rich Library</h3>
                <p className="text-sm text-muted-foreground">
                  Hundreds of stories across fairy tales, adventures, and educational content
                </p>
              </Card>

              <Card className="p-6 rounded-2xl text-center hover-elevate">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">Read Aloud</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered voice narration brings every story to life with engaging audio
                </p>
              </Card>

              <Card className="p-6 rounded-2xl text-center hover-elevate">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">Rewards System</h3>
                <p className="text-sm text-muted-foreground">
                  Motivate reading with checkpoints and rewards that make learning fun
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Mobile Welcome Section */}
          <div className="md:hidden px-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">
                {parentSettings?.childName ? `Welcome ${parentSettings.childName}` : 'Welcome to StoryNest'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">Magical bedtime stories for your little ones</p>
          </div>

          {/* Categories */}
          <div className="px-4 mb-6">
            <CategoryChips 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Stories Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Desktop CTA Card */}
            <div className="hidden md:block container mx-auto px-6">
              <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-primary font-medium mb-2">NEW FOR YOU</p>
                    <h3 className="font-heading text-2xl font-bold mb-2">Fresh Stories Daily</h3>
                    <p className="text-sm text-muted-foreground">Discover new adventures every day</p>
                  </div>
                  <div className="bg-primary/20 rounded-full p-4">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Mobile CTA Card */}
            <div className="md:hidden px-4">
              <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-primary font-medium mb-1">NEW FOR YOU</p>
                    <h3 className="font-heading text-base font-bold mb-1">Fresh Stories Daily</h3>
                    <p className="text-xs text-muted-foreground">Discover new adventures every day</p>
                  </div>
                  <div className="bg-primary/20 rounded-full p-3">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Card>
            </div>

            {selectedCategory !== "All" ? (
              filteredStories.length > 0 && (
                <div className="md:container md:mx-auto md:px-6">
                  <HorizontalStoryCarousel
                    title={`${selectedCategory} Stories`}
                    stories={filteredStories}
                    showBookmark={false}
                    onRead={(story) => user ? setLocation(`/child-mode?story=${story.id}`) : setLocation("/auth")}
                  />
                </div>
              )
            ) : (
              <>
                {filteredStories.length > 0 && (
                  <div className="md:container md:mx-auto md:px-6">
                    <div className="px-4 md:px-0 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base md:text-xl font-bold">Trending Now</h3>
                      </div>
                      <button 
                        className="text-xs md:text-sm text-primary font-medium hover-elevate px-3 py-1 rounded-lg"
                        onClick={() => setLocation("/stories")}
                        data-testid="button-view-all-trending"
                      >
                        View All
                      </button>
                    </div>
                    <HorizontalStoryCarousel
                      title=""
                      stories={filteredStories}
                      showBookmark={false}
                      onRead={(story) => user ? setLocation(`/child-mode?story=${story.id}`) : setLocation("/auth")}
                    />
                  </div>
                )}
                
                {allStories.filter(s => s.category === "fairy-tale" || s.category === "educational").length > 0 && (
                  <div className="md:container md:mx-auto md:px-6">
                    <div className="px-4 md:px-0 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base md:text-xl font-bold">Bedtime Favorites</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs" data-testid="badge-popular">Popular</Badge>
                    </div>
                    <HorizontalStoryCarousel
                      title=""
                      stories={allStories.filter(s => s.category === "fairy-tale" || s.category === "educational")}
                      showBookmark={false}
                      onRead={(story) => user ? setLocation(`/child-mode?story=${story.id}`) : setLocation("/auth")}
                    />
                  </div>
                )}
                
                {allStories.filter(s => s.category === "adventure").length > 0 && (
                  <div className="md:container md:mx-auto md:px-6">
                    <div className="px-4 md:px-0 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base md:text-xl font-bold">Adventure Time</h3>
                      </div>
                    </div>
                    <HorizontalStoryCarousel
                      title=""
                      stories={allStories.filter(s => s.category === "adventure")}
                      showBookmark={false}
                      onRead={(story) => user ? setLocation(`/child-mode?story=${story.id}`) : setLocation("/auth")}
                    />
                  </div>
                )}
              </>
            )}

            {!user && (
              <div className="px-4 md:container md:mx-auto md:px-6 pb-8">
                <Card className="border-dashed border-2 border-primary/30 p-6 md:p-8 rounded-2xl text-center">
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-primary mx-auto mb-3" />
                  <h3 className="font-heading text-base md:text-2xl font-bold mb-2">Unlock All Stories</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                    Sign in to access our full library of magical tales and start your reading journey
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setLocation("/auth")}
                    className="rounded-xl"
                    data-testid="button-unlock-stories"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Card>
              </div>
            )}
          </motion.div>
        </main>
        
        <MobileBottomNav />
      </div>
    </div>
  );
}
