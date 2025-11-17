import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book } from "lucide-react";
import type { Story } from "@shared/schema";
import { StoryCard } from "@/components/StoryCard";

export default function StoriesPage() {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
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
          <h1 className="font-heading text-3xl text-foreground">All Stories</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-48 bg-muted" />
                <CardContent className="h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <Card className="p-12 text-center">
            <Book className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-2xl mb-2">No Stories Yet</h2>
            <p className="text-muted-foreground">
              There are no published stories available at the moment.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
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
    </div>
  );
}
