import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PINDialog } from "@/components/PINDialog";
import { RewardsDialog } from "@/components/RewardsDialog";
import type { CheckpointProgress } from "@/components/RewardsDialog";
import { PDFViewer } from "@/components/PDFViewer";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, Star, Heart, Circle, FileText, Sparkles, Music } from "lucide-react";
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
      // Fullscreen request failed or denied
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      // Fullscreen exit failed
    }
  };

  const startReading = () => {
    // Prioritize audioUrl over voiceoverUrl
    const audioSource = currentStory?.audioUrl || currentStory?.voiceoverUrl;
    
    if (!currentStory || !audioSource) return;

    stopReading();

    // Determine the audio URL: use proxy for Firebase URLs, direct for data URLs
    let audioUrl = audioSource;
    if (audioSource.startsWith('http') || audioSource.startsWith('/')) {
      // Firebase URL or proxy path - use proxy endpoint
      audioUrl = currentStory.id ? `/api/audio-proxy/${currentStory.id}` : audioSource;
    }
    // Otherwise use as-is (data URLs like base64)

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    
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

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 95,
    y: Math.random() * 85,
    delay: Math.random() * 3,
    duration: Math.random() * 8 + 12,
    type: ['heart', 'star', 'circle', 'sparkles'][i % 4],
    size: Math.random() * 8 + 4,
  }));

  const celebrationParticles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: i * 0.05,
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
              opacity: [0, 0.8, 0.8, 0],
              rotate: [0, 360],
              scale: [0.6, 1.1, 1, 0.8],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "easeInOut",
            }}
          >
            {elem.type === 'heart' && (
              <Heart className="text-pink-400 dark:text-pink-300 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
            {elem.type === 'star' && (
              <Star className="text-yellow-400 dark:text-yellow-300 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
            {elem.type === 'circle' && (
              <Circle className="text-blue-400 dark:text-blue-300 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
            {elem.type === 'sparkles' && (
              <Sparkles className="text-purple-400 dark:text-purple-300 drop-shadow-lg" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-2 sm:p-3 flex justify-between items-center bg-gradient-to-r from-purple-300/40 via-pink-300/40 to-blue-300/40 dark:from-purple-800/50 dark:via-pink-800/50 dark:to-blue-800/50 backdrop-blur-md shadow-lg"
        >
          <div className="flex gap-1.5 sm:gap-2 items-center">
            {stories.length > 1 && (
              <>
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg hover:shadow-xl"
                    onClick={prevStory}
                    data-testid="button-prev-story"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-secondary to-accent text-white font-bold shadow-lg hover:shadow-xl"
                    onClick={nextStory}
                    data-testid="button-next-story"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </motion.div>
              </>
            )}
            {settings?.childName && (
              <motion.span 
                className="hidden sm:inline font-heading text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-300 dark:via-pink-300 dark:to-blue-300 bg-clip-text text-transparent ml-3 drop-shadow-lg"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✨ {settings.childName}'s Story Time ✨
              </motion.span>
            )}
          </div>
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 shadow-lg hover:shadow-xl"
              onClick={handleExit}
              data-testid="button-exit-child-mode"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </motion.div>
        </motion.header>

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
              <motion.div 
                className="text-center mb-4 sm:mb-6 px-2"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h1 
                  className="font-heading text-2xl sm:text-4xl md:text-6xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-300 dark:via-pink-300 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-lg"
                  animate={isReading ? { scale: [1, 1.08, 1], y: [0, -5, 0] } : { scale: 1, y: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  data-testid="text-current-story-title"
                >
                  {currentStory.title}
                </motion.h1>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="inline-block ml-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400 drop-shadow-lg inline" fill="currentColor" />
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex-1 bg-gradient-to-br from-white/80 to-pink-50/60 dark:from-gray-900/80 dark:to-purple-900/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl overflow-y-auto border-4 border-gradient-to-r from-purple-300/50 to-blue-300/50 dark:from-purple-600/50 dark:to-blue-600/50 flex flex-col gap-4"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.p 
                  className="text-base sm:text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap font-medium"
                  animate={isReading ? { opacity: [0.85, 1, 0.85] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  data-testid="text-current-story-content"
                >
                  {currentStory.content}
                </motion.p>

                {currentStory.pdfUrl && (
                  <motion.div 
                    className="w-full mt-6 rounded-xl overflow-hidden shadow-lg border-2 border-purple-200/50 dark:border-purple-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <PDFViewer pdfUrl={`/api/pdf-proxy/${currentStory.id}`} height="500px" />
                  </motion.div>
                )}

              </motion.div>

              <motion.div 
                className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-6 sm:mt-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentStory.imageUrl && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.img
                      src={currentStory.imageUrl}
                      alt={currentStory.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl"
                      animate={{ 
                        rotate: isReading ? 360 : 0,
                        scale: isReading ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ 
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      data-testid="img-current-story"
                    />
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.08, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    className="w-full sm:w-auto rounded-full text-lg sm:text-2xl px-10 sm:px-12 py-7 sm:py-9 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold shadow-2xl border-2 border-white/30 hover:border-white/60 transition-all"
                    onClick={isReading ? stopReading : startReading}
                    disabled={!currentStory.audioUrl && !currentStory.voiceoverUrl && !isReading}
                    data-testid="button-read-aloud"
                  >
                    <motion.div
                      className="flex items-center justify-center"
                      animate={isReading ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {isReading ? (
                        <>
                          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity }}>
                            <VolumeX className="w-8 h-8 mr-3" />
                          </motion.div>
                          Stop Story
                        </>
                      ) : (
                        <>
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <Volume2 className="w-8 h-8 mr-3" />
                          </motion.div>
                          {(currentStory.audioUrl || currentStory.voiceoverUrl) ? "Read to Me" : "No Recording"}
                        </>
                      )}
                    </motion.div>
                  </Button>
                </motion.div>
              </motion.div>
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
