import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Sparkles, Play, Clock, TrendingUp, Star } from "lucide-react";
import { useLocation } from "wouter";
import { HorizontalStoryCarousel } from "@/components/HorizontalStoryCarousel";
import { CategoryChips } from "@/components/CategoryChips";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@shared/schema";
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
    <div className="min-h-screen bg-background pb-20">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <MobileHeader showSearch onSearch={handleSearch} />
        
        <main className="px-0 pt-2">
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Welcome to StoryNest</h2>
            </div>
            <p className="text-sm text-muted-foreground">Magical bedtime stories for your little ones</p>
          </div>

          <div className="px-4 mb-4">
            <CategoryChips 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="px-4">
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
                <HorizontalStoryCarousel
                  title={`${selectedCategory} Stories`}
                  stories={filteredStories}
                  showBookmark={false}
                  onRead={(story) => user ? setLocation(`/child-mode?story=${story.id}`) : setLocation("/auth")}
                />
              )
            ) : (
              <>
                {filteredStories.length > 0 && (
                  <div>
                    <div className="px-4 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base font-bold">Trending Now</h3>
                      </div>
                      <button 
                        className="text-xs text-primary font-medium"
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
                      onRead={(story) => setLocation(`/child-mode?story=${story.id}`)}
                    />
                  </div>
                )}
                
                {allStories.filter(s => s.category === "fairy-tale" || s.category === "educational").length > 0 && (
                  <div>
                    <div className="px-4 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base font-bold">Bedtime Favorites</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs" data-testid="badge-popular">Popular</Badge>
                    </div>
                    <HorizontalStoryCarousel
                      title=""
                      stories={allStories.filter(s => s.category === "fairy-tale" || s.category === "educational")}
                      showBookmark={false}
                      onRead={(story) => setLocation(`/child-mode?story=${story.id}`)}
                    />
                  </div>
                )}
                
                {allStories.filter(s => s.category === "adventure").length > 0 && (
                  <div>
                    <div className="px-4 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-base font-bold">Adventure Time</h3>
                      </div>
                    </div>
                    <HorizontalStoryCarousel
                      title=""
                      stories={allStories.filter(s => s.category === "adventure")}
                      showBookmark={false}
                      onRead={(story) => setLocation(`/child-mode?story=${story.id}`)}
                    />
                  </div>
                )}
              </>
            )}

            {!user && (
              <div className="px-4 pb-8">
                <Card className="border-dashed border-2 border-primary/30 p-6 rounded-2xl text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-heading text-base font-bold mb-2">Unlock All Stories</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sign in to access our full library of magical tales</p>
                  <button
                    onClick={() => setLocation("/auth")}
                    className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover-elevate active-elevate-2"
                    data-testid="button-unlock-stories"
                  >
                    Get Started
                  </button>
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
