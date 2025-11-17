import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, TrendingUp } from "lucide-react";
import type { Story } from "@shared/schema";
import { StoryCard } from "@/components/StoryCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { CategoryChips } from "@/components/CategoryChips";
import { useState } from "react";

export default function StoriesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const categories = ["All", "Fairy Tale", "Adventure", "Educational", "Moral", "History"];

  const categoryMap: Record<string, string[]> = {
    "All": [],
    "Fairy Tale": ["fairy-tale"],
    "Adventure": ["adventure"],
    "Educational": ["educational"],
    "Moral": ["moral"],
    "History": ["history"],
  };

  const filteredStories = stories.filter((story: Story) => {
    const categoryValues = categoryMap[selectedCategory] || [];
    const matchesCategory = selectedCategory === "All" || 
      categoryValues.some(cat => story.category.toLowerCase() === cat.toLowerCase());
    
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.summary && story.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader showSearch onSearch={handleSearch} />
      
      <div className="pt-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="mr-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-bold">All Stories</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">Discover our complete collection</p>
        </div>

        <div className="px-4 mb-4">
          <CategoryChips 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {isLoading ? (
          <div className="px-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] bg-muted" />
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted/70 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="px-4">
            <Card className="p-8 text-center rounded-2xl">
              <Book className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h2 className="font-heading text-lg font-bold mb-2">No Stories Found</h2>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== "All" 
                  ? "Try a different search or category" 
                  : "There are no published stories available at the moment."}
              </p>
            </Card>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3">
            {filteredStories.map((story: Story) => (
              <StoryCard
                key={story.id}
                story={story}
                showBookmark={false}
                onRead={() => setLocation(`/child-mode?story=${story.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
