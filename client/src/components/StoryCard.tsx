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
      whileHover={{ y: -12 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      className="h-full"
    >
      <Card className="overflow-hidden rounded-[2.5rem] border-none bg-orange-500 hover-elevate h-full flex flex-col shadow-2xl transition-all group relative" data-testid={`card-story-${story.id}`}>
        {/* Glassmorphism Effect Overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden m-3 rounded-[2rem] shadow-inner">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
            data-testid={`img-story-${story.id}`}
          />
          
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

          {/* Bookmark Button - Float Style */}
          {showBookmark && (
            <motion.div
              className="absolute top-4 right-4"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 shadow-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark?.(story);
                }}
                data-testid={`button-bookmark-${story.id}`}
              >
                {story.isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5 fill-white" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 pt-2">
          <motion.h3 
            className="font-heading text-2xl text-white mb-3 line-clamp-1 drop-shadow-sm" 
            data-testid={`text-story-title-${story.id}`}
          >
            {story.title}
          </motion.h3>

          <motion.p 
            className="text-white/90 text-sm line-clamp-2 mb-6 font-medium leading-relaxed"
            data-testid={`text-story-summary-${story.id}`}
          >
            {story.summary}
          </motion.p>

          <div className="mt-auto">
            <Button
              onClick={() => onRead?.(story)}
              className="w-full h-14 rounded-full bg-white text-orange-600 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-lg shadow-xl border-none group/btn"
              data-testid={`button-read-${story.id}`}
            >
              <BookOpen className="w-5 h-5 mr-3 transition-transform group-hover/btn:rotate-12" />
              Read Story
              <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
