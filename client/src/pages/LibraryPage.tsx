import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookMarked } from "lucide-react";
import type { Story } from "@shared/schema";
import { StoryCard } from "@/components/StoryCard";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function LibraryPage() {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  // Filter only bookmarked stories
  const bookmarkedStories = stories.filter(story => story.isBookmarked);

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const story = stories.find(s => s.id === storyId);
      if (!story) return;
      
      // The StoryCard handles the toggle logic
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-3xl text-foreground">My Library</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-48 bg-muted" />
                <CardContent className="h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : bookmarkedStories.length === 0 ? (
          <Card className="p-12 text-center">
            <BookMarked className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-2xl mb-2">No Bookmarks Yet</h2>
            <p className="text-muted-foreground">
              Start bookmarking your favorite stories to see them here.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="mt-4"
              data-testid="button-browse-stories"
            >
              Browse Stories
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                showBookmark={true}
                onRead={() => setLocation(`/child-mode?story=${story.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
