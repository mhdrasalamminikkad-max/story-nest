import { StoryCard } from "@/components/StoryCard";
import type { Story } from "@shared/schema";

interface HorizontalStoryCarouselProps {
  title: string;
  stories: Story[];
  showBookmark?: boolean;
  onRead: (story: Story) => void;
}

export function HorizontalStoryCarousel({ 
  title, 
  stories, 
  showBookmark = false, 
  onRead 
}: HorizontalStoryCarouselProps) {
  if (stories.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="font-heading text-xl font-semibold mb-3 px-4 text-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-2">
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 w-40">
              <StoryCard
                story={story}
                showBookmark={showBookmark}
                onRead={() => onRead(story)}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
