import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PINDialog } from "@/components/PINDialog";
import { RewardsDialog } from "@/components/RewardsDialog";
import type { CheckpointProgress } from "@/components/RewardsDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, Star, Heart, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChildModeReadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [showPINDialog, setShowPINDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRewardsDialog, setShowRewardsDialog] = useState(false);
  const [newlyEarnedRewards, setNewlyEarnedRewards] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef<{
    ended?: () => void;
    error?: () => void;
  }>({});

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const { data: checkpointProgress = [] } = useQuery<CheckpointProgress[]>({
    queryKey: ["/api/checkpoints/progress"],
  });

  const trackStoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkpoints/track-story");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.newlyCompleted && data.newlyCompleted.length > 0) {
        setNewlyEarnedRewards(data.newlyCompleted.map((c: any) => c.id));
        setShowRewardsDialog(true);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/checkpoints/progress"] });
    },
  });

  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("story");
    if (storyId && stories.length > 0) {
      const index = stories.findIndex(s => s.id === storyId);
      if (index !== -1) {
        setCurrentStoryIndex(index);
      }
    }
  }, [stories]);

  useEffect(() => {
    if (settings?.fullscreenLockEnabled && containerRef.current && !isFullscreen) {
      enterFullscreen();
    }

    return () => {
      if (isReading) {
        stopReading();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [settings]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Failed to exit fullscreen:", err);
    }
  };

  const startReading = () => {
    // Prioritize audioUrl over voiceoverUrl
    const audioSource = currentStory?.audioUrl || currentStory?.voiceoverUrl;
    
    if (!currentStory || !audioSource) return;

    stopReading();

    const audio = new Audio(audioSource);
    
    // Cleanup function to remove all listeners
    const cleanup = () => {
      const { ended, error } = handlersRef.current;
      if (audio && ended) {
        audio.removeEventListener('ended', ended);
      }
      if (audio && error) {
        audio.removeEventListener('error', error);
        audio.removeEventListener('stalled', error);
        audio.removeEventListener('abort', error);
      }
    };
    
    const handleEnded = () => {
      cleanup();
      setIsReading(false);
      trackStoryMutation.mutate();
    };
    
    const handleError = () => {
      cleanup();
      console.error("Error playing audio");
      setIsReading(false);
      toast({
        title: "Playback Error",
        description: "Unable to play the audio. Please try another story.",
        variant: "destructive",
        duration: 4000,
      });
    };

    // Store handler references for proper cleanup
    handlersRef.current = { ended: handleEnded, error: handleError };

    // Add event listeners
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleError);
    audio.addEventListener('abort', handleError);
    
    audioRef.current = audio;
    
    audio.play().catch((error) => {
      cleanup();
      console.error("Audio playback failed:", error);
      setIsReading(false);
      toast({
        title: "Playback Error",
        description: "Unable to play the audio. Please try another story.",
        variant: "destructive",
        duration: 4000,
      });
    });
    
    setIsReading(true);
  };

  const stopReading = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Remove ALL event listeners using stored references to prevent memory leaks
      const { ended, error } = handlersRef.current;
      if (ended) {
        audioRef.current.removeEventListener('ended', ended);
      }
      if (error) {
        audioRef.current.removeEventListener('error', error);
        audioRef.current.removeEventListener('stalled', error);
        audioRef.current.removeEventListener('abort', error);
      }
      
      audioRef.current = null;
    }
    
    // Clear handler references
    handlersRef.current = {};
    setIsReading(false);
  };

  const handleVerifyPIN = async (pin: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/verify-pin", { pin });
      const response = await res.json();
      if (response.valid) {
        await exitFullscreen();
        setLocation("/dashboard");
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleExit = () => {
    stopReading();
    setShowPINDialog(true);
  };

  const nextStory = () => {
    if (stories.length === 0) return;
    stopReading();
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    if (stories.length === 0) return;
    stopReading();
    setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const twinklingStars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1,
  }));

  const floatingElements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 90,
    y: Math.random() * 80,
    delay: Math.random() * 3,
    duration: Math.random() * 8 + 12,
    type: ['heart', 'star', 'circle'][i % 3],
  }));

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No stories available. Please add stories first.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 relative overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none">
        {twinklingStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          >
            <Star className="w-2 h-2 text-yellow-400 dark:text-yellow-200" fill="currentColor" />
          </motion.div>
        ))}

        {floatingElements.map((elem) => (
          <motion.div
            key={elem.id}
            className="absolute"
            style={{ left: `${elem.x}%` }}
            initial={{ y: "100vh", opacity: 0 }}
            animate={{
              y: "-10vh",
              opacity: [0, 0.7, 0.7, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "linear",
            }}
          >
            {elem.type === 'heart' && (
              <Heart className="w-6 h-6 text-pink-400 dark:text-pink-300" fill="currentColor" />
            )}
            {elem.type === 'star' && (
              <Star className="w-6 h-6 text-yellow-400 dark:text-yellow-300" fill="currentColor" />
            )}
            {elem.type === 'circle' && (
              <Circle className="w-6 h-6 text-blue-400 dark:text-blue-300" fill="currentColor" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <header className="p-2 sm:p-3 flex justify-between items-center bg-gradient-to-r from-purple-200/30 via-pink-200/30 to-blue-200/30 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 backdrop-blur-sm">
          <div className="flex gap-1.5 sm:gap-2 items-center">
            {stories.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
                  onClick={prevStory}
                  data-testid="button-prev-story"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
                  onClick={nextStory}
                  data-testid="button-next-story"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </>
            )}
            {settings?.childName && (
              <span className="hidden sm:inline font-heading text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent ml-2">
                {settings.childName}'s Story Time
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleExit}
            data-testid="button-exit-child-mode"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 sm:py-6 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0"
            >
              <motion.h1 
                className="font-heading text-2xl sm:text-4xl md:text-6xl text-center mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent px-2"
                animate={isReading ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                data-testid="text-current-story-title"
              >
                {currentStory.title}
              </motion.h1>

              <div className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl overflow-y-auto border-2 sm:border-4 border-purple-200 dark:border-purple-800">
                <motion.p 
                  className="text-base sm:text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap font-medium"
                  animate={isReading ? { opacity: [0.9, 1, 0.9] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  data-testid="text-current-story-content"
                >
                  {currentStory.content}
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                {currentStory.imageUrl && (
                  <motion.img
                    src={currentStory.imageUrl}
                    alt={currentStory.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                    animate={{ rotate: isReading ? 360 : 0 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    data-testid="img-current-story"
                  />
                )}
                <Button
                  className="rounded-full text-lg sm:text-2xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-2xl"
                  onClick={isReading ? stopReading : startReading}
                  disabled={!currentStory.audioUrl && !currentStory.voiceoverUrl && !isReading}
                  data-testid="button-read-aloud"
                >
                  {isReading ? (
                    <>
                      <VolumeX className="w-8 h-8 mr-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-8 h-8 mr-3" />
                      {currentStory.voiceoverUrl ? "Read to Me" : "No Recording"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PINDialog
        open={showPINDialog}
        onOpenChange={setShowPINDialog}
        onVerify={handleVerifyPIN}
        title="Exit Child Mode"
        description="Enter parent PIN to return to dashboard"
      />

      <RewardsDialog
        open={showRewardsDialog}
        onOpenChange={setShowRewardsDialog}
        checkpoints={checkpointProgress}
        newlyEarned={newlyEarnedRewards}
      />
    </div>
  );
}
