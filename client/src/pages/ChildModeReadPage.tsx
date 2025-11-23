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
      className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900 relative overflow-hidden"
    >
      {/* Ultra-Beautiful Animated Background Elements */}
      <motion.div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-yellow-300/15 to-orange-300/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </motion.div>
      <div className="fixed inset-0 pointer-events-none">
        {twinklingStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0, 1.2, 0],
              boxShadow: ["0 0 0px rgba(255,255,0,0)", "0 0 15px rgba(255,255,0,0.8)", "0 0 0px rgba(255,255,0,0)"]
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          >
            <Star className="w-3 h-3 text-yellow-300 dark:text-yellow-200" fill="currentColor" />
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
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="p-3 sm:p-4 flex justify-between items-center bg-gradient-to-r from-purple-400/50 via-pink-400/50 to-blue-400/50 dark:from-purple-700/60 dark:via-pink-700/60 dark:to-blue-700/60 backdrop-blur-xl shadow-2xl border-b-4 border-white/20"
        >
          <div className="flex gap-2 sm:gap-3 items-center">
            {stories.length > 1 && (
              <>
                <motion.div whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.85 }}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-11 w-11 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-2xl hover:shadow-3xl border-2 border-white/40"
                    onClick={prevStory}
                    data-testid="button-prev-story"
                  >
                    <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.85 }}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-11 w-11 sm:h-12 sm:w-12 bg-gradient-to-br from-pink-500 to-blue-500 text-white font-bold shadow-2xl hover:shadow-3xl border-2 border-white/40"
                    onClick={nextStory}
                    data-testid="button-next-story"
                  >
                    <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                  </Button>
                </motion.div>
              </>
            )}
            {settings?.childName && (
              <motion.div 
                className="hidden sm:flex items-center gap-2 ml-4 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full border-2 border-white/60"
                animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-2xl">📖</span>
                <span className="font-heading text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-200 dark:via-pink-200 dark:to-blue-200 bg-clip-text text-transparent">
                  {settings.childName}'s Story Time
                </span>
              </motion.div>
            )}
          </div>
          <motion.div whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full h-11 w-11 sm:h-12 sm:w-12 shadow-2xl hover:shadow-3xl border-2 border-white/40 bg-red-500 hover:bg-red-600"
              onClick={handleExit}
              data-testid="button-exit-child-mode"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7" />
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
                className="text-center mb-6 sm:mb-8 px-2"
                initial={{ y: -40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <motion.div className="mb-4 flex justify-center gap-2">
                  <motion.span animate={{ rotate: [0, 360], y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <span className="text-4xl sm:text-6xl">✨</span>
                  </motion.span>
                  <motion.span animate={{ rotate: [0, -360], y: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}>
                    <span className="text-4xl sm:text-6xl">📚</span>
                  </motion.span>
                  <motion.span animate={{ rotate: [0, 360], y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}>
                    <span className="text-4xl sm:text-6xl">✨</span>
                  </motion.span>
                </motion.div>
                <motion.h1 
                  className="font-heading text-3xl sm:text-5xl md:text-7xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-200 dark:via-pink-200 dark:to-blue-200 bg-clip-text text-transparent drop-shadow-2xl leading-tight"
                  animate={isReading ? { scale: [1, 1.1, 1], y: [0, -8, 0] } : { scale: 1, y: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  data-testid="text-current-story-title"
                >
                  {currentStory.title}
                </motion.h1>
              </motion.div>

              <motion.div 
                className="flex-1 bg-gradient-to-br from-white/90 via-purple-50/80 to-pink-50/70 dark:from-gray-800/90 dark:via-purple-900/80 dark:to-pink-900/70 backdrop-blur-lg rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-y-auto border-4 border-purple-300/40 dark:border-purple-600/50 flex flex-col gap-6"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
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
                className="flex flex-col items-center justify-center gap-6 sm:gap-8 mt-8 sm:mt-10"
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                {/* Image with decorative animation */}
                {currentStory.imageUrl && (
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 blur-xl"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.img
                      src={currentStory.imageUrl}
                      alt={currentStory.title}
                      className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-3xl"
                      animate={{ 
                        rotate: isReading ? 360 : 0,
                        scale: isReading ? [1, 1.15, 1] : 1,
                      }}
                      transition={{ 
                        rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      data-testid="img-current-story"
                    />
                  </motion.div>
                )}

                {/* Ultra-Beautiful Read Button */}
                <motion.div
                  whileHover={{ scale: 1.12, boxShadow: "0 30px 60px rgba(139, 92, 246, 0.9)" }}
                  whileTap={{ scale: 0.92 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    className="w-full sm:w-auto rounded-3xl text-xl sm:text-3xl px-12 sm:px-16 py-8 sm:py-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white font-bold shadow-3xl border-3 border-white/40 hover:border-white/80 transition-all relative overflow-hidden"
                    onClick={isReading ? stopReading : startReading}
                    disabled={!currentStory.audioUrl && !currentStory.voiceoverUrl && !isReading}
                    data-testid="button-read-aloud"
                  >
                    <motion.div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all" />
                    <motion.div
                      className="relative flex items-center justify-center gap-3"
                      animate={isReading ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {isReading ? (
                        <>
                          <motion.div animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                            <VolumeX className="w-9 h-9 sm:w-10 sm:h-10" />
                          </motion.div>
                          <span className="font-heading">Stop Story</span>
                        </>
                      ) : (
                        <>
                          <motion.div animate={{ scale: [1, 1.3, 1], y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <Volume2 className="w-9 h-9 sm:w-10 sm:h-10" />
                          </motion.div>
                          <span className="font-heading">
                            {(currentStory.audioUrl || currentStory.voiceoverUrl) ? "Read to Me" : "No Recording"}
                          </span>
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
