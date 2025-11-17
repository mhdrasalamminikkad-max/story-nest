import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, Heart, ArrowLeft } from "lucide-react";
import type { Story } from "@shared/schema";
import { StoryCard } from "@/components/StoryCard";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileHeader } from "@/components/MobileHeader";

export default function LibraryPage() {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const bookmarkedStories = stories.filter((story: Story) => story.isBookmarked);

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const story = stories.find((s: Story) => s.id === storyId);
      if (!story) return;
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader />
      
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
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="font-heading text-lg font-bold">My Library</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">Your favorite stories in one place</p>
        </div>

        {isLoading ? (
          <div className="px-4 grid grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] bg-muted" />
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted/70 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookmarkedStories.length === 0 ? (
          <div className="px-4">
            <Card className="p-8 text-center rounded-2xl">
              <BookMarked className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h2 className="font-heading text-lg font-bold mb-2">No Bookmarks Yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Start bookmarking your favorite stories to see them here.
              </p>
              <Button
                onClick={() => setLocation("/stories")}
                className="rounded-xl"
                data-testid="button-browse-stories"
              >
                Browse Stories
              </Button>
            </Card>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3">
            {bookmarkedStories.map((story: Story) => (
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

      <MobileBottomNav />
    </div>
  );
}
