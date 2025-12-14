import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
  onRead?: (story: Story) => void;
  onToggleBookmark?: (story: Story) => void;
  showBookmark?: boolean;
  compact?: boolean;
}

export function StoryCard({ story, onRead, onToggleBookmark, showBookmark = true, compact = false }: StoryCardProps) {
  if (compact) {
    return (
      <motion.button 
        className="cursor-pointer hover-elevate rounded-2xl overflow-hidden text-left w-full group"
        onClick={() => onRead?.(story)}
        data-testid={`card-story-${story.id}`}
        aria-label={`Read ${story.title}`}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:brightness-105"
            loading="lazy"
            data-testid={`img-story-${story.id}`}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="pt-2">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-story-title-${story.id}`}>
            {story.title}
          </h3>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden rounded-3xl border-2 border-primary/10 hover-elevate h-full flex flex-col shadow-lg hover:shadow-2xl transition-all group" data-testid={`card-story-${story.id}`}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-105"
            loading="lazy"
            data-testid={`img-story-${story.id}`}
          />
          
          {/* Overlay Gradient on Hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Bookmark Button */}
          {showBookmark && (
            <motion.div
              className="absolute top-3 right-3"
              whileHover={{ rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="rounded-2xl shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark?.(story);
                }}
                data-testid={`button-bookmark-${story.id}`}
              >
                {story.isBookmarked ? (
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.6 }}>
                    <BookmarkCheck className="h-4 w-4" fill="currentColor" />
                  </motion.div>
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Header */}
        <CardHeader className="pb-2">
          <motion.h3 
            className="font-heading text-xl text-card-foreground line-clamp-2 group-hover:text-primary transition-colors" 
            data-testid={`text-story-title-${story.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {story.title}
          </motion.h3>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 pb-3">
          <motion.p 
            className="text-sm text-muted-foreground line-clamp-3"
            data-testid={`text-story-summary-${story.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {story.summary}
          </motion.p>
        </CardContent>

        {/* Footer */}
        <CardFooter className="pt-0">
          <motion.div
            className="w-full"
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => onRead?.(story)}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold text-white"
              data-testid={`button-read-${story.id}`}
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Read Story
              </motion.div>
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
