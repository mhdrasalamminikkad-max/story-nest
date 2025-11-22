import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { Star, Sparkles, BookOpen, Play, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PINDialog } from "@/components/PINDialog";
import { apiRequest } from "@/lib/queryClient";

export default function ChildModeSelectionPage() {
  const [, setLocation] = useLocation();
  const [showPINDialog, setShowPINDialog] = useState(false);

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const handleVerifyPIN = async (pin: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/verify-pin", { pin });
      const response = await res.json();
      if (response.valid) {
        setLocation("/dashboard");
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleStoryClick = (story: Story) => {
    setLocation(`/child-mode-read?story=${story.id}`);
  };

  const categoryColors: Record<string, string> = {
    "fairy-tale": "bg-pink-500/20 text-pink-700 dark:text-pink-300",
    "adventure": "bg-orange-500/20 text-orange-700 dark:text-orange-300",
    "educational": "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    "moral": "bg-green-500/20 text-green-700 dark:text-green-300",
    "history": "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    "islamic": "bg-teal-500/20 text-teal-700 dark:text-teal-300",
  };

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {floatingElements.map((elem) => (
          <motion.div
            key={elem.id}
            className="absolute"
            style={{
              left: `${elem.x}%`,
              top: `${elem.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "easeInOut",
            }}
          >
            {elem.id % 3 === 0 ? (
              <Star className="w-6 h-6 text-yellow-400/40" fill="currentColor" />
            ) : elem.id % 3 === 1 ? (
              <Heart className="w-6 h-6 text-pink-400/40" fill="currentColor" />
            ) : (
              <Sparkles className="w-6 h-6 text-purple-400/40" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Exit Button */}
      <div className="fixed top-4 right-4 z-50">
        <motion.button
          onClick={() => setShowPINDialog(true)}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover-elevate active-elevate-2 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-exit-child-mode"
        >
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg">👋</span>
          </div>
          <span className="font-medium text-sm">Exit</span>
        </motion.button>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="inline-block text-6xl md:text-8xl mb-4"
          >
            📚
          </motion.div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {settings?.childName ? `Welcome ${settings.childName}!` : "Story Time!"}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
            Choose your magical adventure
          </p>
        </motion.div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📖</div>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No stories available yet. Check back soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all border-4 border-transparent hover:border-primary/30 h-full"
                  onClick={() => handleStoryClick(story)}
                  data-testid={`card-story-${index}`}
                >
                  {/* Story Image */}
                  <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      data-testid={`img-story-${index}`}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={categoryColors[story.category] || "bg-gray-500/20"}>
                        {story.category}
                      </Badge>
                    </div>
                    {story.voiceoverUrl && (
                      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full">
                        <Play className="w-5 h-5 text-primary" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Story Content */}
                  <div className="p-4 md:p-5 bg-white dark:bg-gray-800">
                    <h3 className="font-heading text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 line-clamp-3">
                      {story.summary}
                    </p>

                    {/* Action Button */}
                    <motion.div
                      className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-base md:text-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Read Story</span>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* PIN Dialog */}
      <PINDialog
        open={showPINDialog}
        onOpenChange={setShowPINDialog}
        onVerify={handleVerifyPIN}
        title="Exit Child Mode?"
        description="Ask a parent to enter their PIN"
      />
    </div>
  );
}
