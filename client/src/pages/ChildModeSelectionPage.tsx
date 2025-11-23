import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { Star, Sparkles, BookOpen, Play, Heart, Music, Zap } from "lucide-react";
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
    "fairy-tale": "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-300/50 dark:border-pink-600/50",
    "adventure": "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300/50 dark:border-orange-600/50",
    "educational": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-600/50",
    "moral": "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300/50 dark:border-green-600/50",
    "history": "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300/50 dark:border-purple-600/50",
    "islamic": "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-600/50",
  };

  const floatingElements = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 4,
    size: Math.random() * 10 + 4,
    type: ['star', 'heart', 'sparkles', 'music'][i % 4],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900 relative overflow-hidden">
      {/* ULTRA-BEAUTIFUL ANIMATED BACKGROUND ORBS */}
      <motion.div className="fixed inset-0 pointer-events-none">
        {/* Large drifting gradient orbs */}
        <motion.div 
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
          animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400/25 to-orange-400/25 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* ULTRA-ANIMATED FLOATING ELEMENTS */}
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
              y: [0, -40, 0],
              x: [0, 30, 0],
              rotate: [0, 360],
              scale: [0.8, 1.3, 0.8],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "easeInOut",
            }}
          >
            {elem.type === 'star' && (
              <Star className="text-yellow-400 dark:text-yellow-300 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
            {elem.type === 'heart' && (
              <Heart className="text-pink-500 dark:text-pink-400 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
            {elem.type === 'sparkles' && (
              <Sparkles className="text-purple-500 dark:text-purple-400 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} />
            )}
            {elem.type === 'music' && (
              <Music className="text-blue-500 dark:text-blue-400 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* ULTRA-BEAUTIFUL EXIT BUTTON */}
      <div className="fixed top-6 right-6 z-50">
        <motion.button
          onClick={() => setShowPINDialog(true)}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg flex items-center gap-3 border-2 border-white/40"
          whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.6)" }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-exit-child-mode"
        >
          <motion.span 
            animate={{ rotate: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            👋
          </motion.span>
          <span>Exit</span>
        </motion.button>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        {/* ULTRA-GORGEOUS WELCOME HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center mb-12 md:mb-16"
        >
          {/* ANIMATED EMOJI CELEBRATION */}
          <div className="mb-6 flex justify-center gap-3">
            <motion.span 
              animate={{ rotate: [0, 360], y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl sm:text-7xl md:text-8xl"
            >
              ✨
            </motion.span>
            <motion.span 
              animate={{ rotate: [0, -360], scale: [1, 1.2, 1], y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
              className="text-6xl sm:text-7xl md:text-8xl"
            >
              📚
            </motion.span>
            <motion.span 
              animate={{ rotate: [0, 360], y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
              className="text-6xl sm:text-7xl md:text-8xl"
            >
              ✨
            </motion.span>
          </div>

          {/* MASSIVE BEAUTIFUL TITLE */}
          <motion.h1 
            className="font-heading text-5xl sm:text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-300 dark:via-pink-300 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {settings?.childName ? `Welcome ${settings.childName}!` : "Story Time!"}
          </motion.h1>

          {/* ANIMATED SUBTITLE */}
          <motion.p 
            className="text-2xl sm:text-3xl md:text-4xl text-gray-700 dark:text-gray-300 font-bold drop-shadow-lg"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Choose your magical adventure
          </motion.p>
        </motion.div>

        {/* STORIES GRID - ULTRA BEAUTIFUL */}
        {stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-8xl mb-6 inline-block"
            >
              📖
            </motion.div>
            <p className="text-3xl text-gray-600 dark:text-gray-400 font-bold">
              No stories available yet. Check back soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 40, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                whileHover={{ y: -15, scale: 1.05 }}
                data-testid={`card-story-${index}`}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover-elevate transition-all border-4 border-white/30 h-full shadow-2xl hover:shadow-3xl rounded-3xl"
                  onClick={() => handleStoryClick(story)}
                >
                  {/* STORY IMAGE WITH GRADIENT OVERLAY */}
                  <div className="relative h-56 md:h-64 overflow-hidden bg-gradient-to-br from-purple-300 to-pink-300 dark:from-purple-800 dark:to-pink-800 group">
                    {/* Animated gradient background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />

                    <motion.img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover relative z-10"
                      loading="lazy"
                      data-testid={`img-story-${index}`}
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Glowing overlay on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 z-30">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Badge className={`${categoryColors[story.category] || "bg-gray-500/20"} font-bold text-sm border-2 backdrop-blur-md`}>
                          {story.category}
                        </Badge>
                      </motion.div>
                    </div>

                    {/* Audio Indicator */}
                    {story.voiceoverUrl && (
                      <motion.div 
                        className="absolute bottom-3 right-3 bg-gradient-to-r from-primary to-secondary p-3 rounded-full shadow-lg z-30 border-2 border-white/50"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                          <Play className="w-6 h-6 text-white" fill="currentColor" />
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* STORY CONTENT - ULTRA BEAUTIFUL */}
                  <div className="p-5 md:p-6 bg-gradient-to-br from-white/95 via-purple-50/80 to-pink-50/80 dark:from-gray-800/95 dark:via-purple-900/80 dark:to-pink-900/80 backdrop-blur-sm">
                    {/* Title */}
                    <motion.h3 
                      className="font-heading text-2xl md:text-3xl font-black mb-3 text-gray-900 dark:text-white line-clamp-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 + 0.2 }}
                    >
                      {story.title}
                    </motion.h3>

                    {/* Summary */}
                    <motion.p 
                      className="text-sm md:text-base text-gray-700 dark:text-gray-300 line-clamp-3 mb-5 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.08 + 0.3 }}
                    >
                      {story.summary}
                    </motion.p>

                    {/* ULTRA-BEAUTIFUL READ BUTTON */}
                    <motion.div
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg border-2 border-white/40 relative overflow-hidden group"
                      whileHover={{ scale: 1.08, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.8)" }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 + 0.4 }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <BookOpen className="w-6 h-6" />
                      </motion.div>
                      <span className="relative font-heading">Read Story</span>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* PIN DIALOG */}
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
