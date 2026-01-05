import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PINDialog } from "@/components/PINDialog";
import { RewardsDialog } from "@/components/RewardsDialog";
import type { CheckpointProgress } from "@/components/RewardsDialog";
import { PDFViewer } from "@/components/PDFViewer";
import { StoryGames } from "@/components/StoryGames";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, CheckCircle, Gamepad2 } from "lucide-react";
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
  const [showGames, setShowGames] = useState(false);
  const [storyCompleted, setStoryCompleted] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [shouldAutoStartReading, setShouldAutoStartReading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef<{
    ended?: () => void;
    error?: () => void;
  }>({});

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const { data: checkpointProgress = [] } = useQuery<CheckpointProgress[]>({
    queryKey: ["/api/checkpoints/progress"],
  });

  // Block keyboard shortcuts in child mode read page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block ESC, F11, F12, F5
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log(`[Child Mode Read] Blocked ${e.key}`);
        return false;
      }

      // Block system shortcuts
      if (e.altKey && (e.key === 'F4' || e.key === 'Tab')) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && ['w', 'r', 'q', 'n', 't', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.returnValue = false;
      return false;
    };

    // Enforce fullscreen function
    const enforceFullscreen = async () => {
      // Check if we've exited fullscreen
      if (!document.fullscreenElement) {
        console.log('[Child Mode Read] Fullscreen lost! Forcing re-entry...');
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(err => {
              console.error('[Child Mode Read] requestFullscreen error:', err);
            });
            console.log('[Child Mode Read] Re-entered fullscreen');
          }
        } catch (err) {
          console.error('[Child Mode Read] Failed to re-enter fullscreen:', err);
        }
      }
      
      // Keep window focused
      if (document.hidden) {
        console.log('[Child Mode Read] Document hidden, focusing window...');
        window.focus();
      }
    };

    // Screen area detector - store initial dimensions
    let initialScreenArea = window.innerWidth * window.innerHeight;
    let minScreenArea = initialScreenArea;

    // Aggressive polling - checks every 50ms
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const startFullscreenPolling = () => {
      pollInterval = setInterval(() => {
        const currentScreenArea = window.innerWidth * window.innerHeight;
        
        // Check if screen area has reduced (ESC/F11 exit indicator)
        if (currentScreenArea < minScreenArea * 0.95) { // 95% threshold
          console.log('[Child Mode Read] Screen area reduced from', minScreenArea, 'to', currentScreenArea, '- Forcing fullscreen!');
          minScreenArea = currentScreenArea;
        }
        
        enforceFullscreen();
      }, 50); // Check every 50ms
      // Run immediately on start
      enforceFullscreen();
    };

    // Handle any user interaction - immediately enforce fullscreen
    const handleUserInteraction = async () => {
      console.log('[Child Mode Read] User interaction detected, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Handle visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('[Child Mode Read] Tab hidden');
      } else {
        console.log('[Child Mode Read] Tab visible, enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    // Handle window focus
    const handleWindowFocus = async () => {
      console.log('[Child Mode Read] Window focused, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Window resize listener for screen area detection
    const handleWindowResize = async () => {
      const currentScreenArea = window.innerWidth * window.innerHeight;
      if (currentScreenArea < minScreenArea * 0.95) {
        console.log('[Child Mode Read] Screen resize detected - area reduced! Enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    // Add interaction handlers
    document.addEventListener('click', handleUserInteraction, true);
    document.addEventListener('touchstart', handleUserInteraction, true);
    document.addEventListener('mousedown', handleUserInteraction, true);
    document.addEventListener('touchend', handleUserInteraction, true);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // Add screen area detector - listens for window resizing
    window.addEventListener('resize', handleWindowResize);

    // Start aggressive polling
    startFullscreenPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      
      document.removeEventListener('click', handleUserInteraction, true);
      document.removeEventListener('touchstart', handleUserInteraction, true);
      document.removeEventListener('mousedown', handleUserInteraction, true);
      document.removeEventListener('touchend', handleUserInteraction, true);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const currentStoryFromList = stories[currentStoryIndex];
  const currentStoryId = currentStoryFromList?.id;

  const { data: storyDetails, isLoading: loadingDetails } = useQuery<Story>({
    queryKey: ["/api/stories", currentStoryId],
    enabled: !!currentStoryId,
  });

  const currentStory = storyDetails || currentStoryFromList;

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
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
    }
  };

  const startReading = () => {
    const audioSource = storyDetails?.voiceoverUrl || storyDetails?.audioUrl;
    
    if (!storyDetails || !audioSource) return;

    stopReading();

    let audioUrl = audioSource;
    if (audioSource.startsWith('http') || audioSource.startsWith('/')) {
      audioUrl = storyDetails.id ? `/api/audio-proxy/${storyDetails.id}` : audioSource;
    }

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    
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
      setStoryCompleted(true);
      setShowGames(true);
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

    handlersRef.current = { ended: handleEnded, error: handleError };

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
    setShowGames(false);
    setStoryCompleted(false);
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    if (stories.length === 0) return;
    stopReading();
    setShowGames(false);
    setStoryCompleted(false);
    setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleFinishStory = () => {
    setStoryCompleted(true);
    setShowGames(true);
    trackStoryMutation.mutate();
  };

  const handleGameComplete = () => {
    setShowGames(false);
  };

  // Auto-start reading when PDF loads
  useEffect(() => {
    if (pdfLoaded && shouldAutoStartReading && storyDetails) {
      const hasAudio = storyDetails.voiceoverUrl || storyDetails.audioUrl;
      if (hasAudio) {
        startReading();
      }
      setShouldAutoStartReading(false);
      setPdfLoaded(false);
    }
  }, [pdfLoaded, shouldAutoStartReading, storyDetails]);

  const handlePdfLoaded = () => {
    setPdfLoaded(true);
    // Use a small timeout to ensure state is settled
    setTimeout(() => {
      if (storyDetails && !isReading && !audioRef.current) {
        const hasAudio = storyDetails.voiceoverUrl || storyDetails.audioUrl;
        if (hasAudio) {
          startReading();
        }
      }
    }, 500);
  };

  if (!currentStoryFromList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No stories available. Please add stories first.</p>
      </div>
    );
  }

  if (loadingDetails && !currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  const hasAudio = storyDetails?.voiceoverUrl || storyDetails?.audioUrl;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 relative overflow-hidden"
    >
      <div className="relative z-10 h-screen flex flex-col">
        <header className="p-3 sm:p-4 flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex gap-2 sm:gap-3 items-center">
            {stories.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={prevStory}
                  data-testid="button-prev-story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={nextStory}
                  data-testid="button-next-story"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white text-center flex-1" data-testid="text-current-story-title">
            {currentStory?.title}
          </h2>

          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={handleExit}
            data-testid="button-exit-story"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {showGames ? (
              <motion.div
                key="games"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-gray-200 dark:border-gray-700">
                  <StoryGames 
                    story={currentStory!} 
                    onComplete={handleGameComplete}
                    onNextStory={nextStory}
                  />
                </div>
              </motion.div>
            ) : currentStory?.pdfUrl || storyDetails?.pdfUrl ? (
              <motion.div
                key={currentStory?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-auto">
                  <PDFViewer pdfUrl={`/api/pdf-proxy/${storyDetails?.id || currentStory?.id}`} fillScreen onPdfLoaded={handlePdfLoaded} />
                </div>
                <div className="flex justify-center py-4 sticky bottom-0 bg-gradient-to-t from-purple-100 via-pink-100/80 to-transparent dark:from-purple-950 dark:via-pink-950/80 dark:to-transparent">
                  <Button
                    className="rounded-2xl text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={isReading ? stopReading : startReading}
                    disabled={!hasAudio && !isReading}
                    data-testid="button-read-aloud-pdf"
                  >
                    <div className="flex items-center gap-2">
                      {isReading ? (
                        <>
                          <VolumeX className="w-6 h-6" />
                          <span>Stop Story</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-6 h-6" />
                          <span>{hasAudio ? "Read to Me" : "No Recording"}</span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStory?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 max-w-4xl mx-auto"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-gray-200 dark:border-gray-700">
                  <p 
                    className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap"
                    data-testid="text-current-story-content"
                  >
                    {currentStory?.content}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Button
                    className="rounded-2xl text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={isReading ? stopReading : startReading}
                    disabled={!hasAudio && !isReading}
                    data-testid="button-read-aloud"
                  >
                    <div className="flex items-center gap-2">
                      {isReading ? (
                        <>
                          <VolumeX className="w-6 h-6" />
                          <span>Stop Story</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-6 h-6" />
                          <span>{hasAudio ? "Read to Me" : "No Recording"}</span>
                        </>
                      )}
                    </div>
                  </Button>

                  <Button
                    className="rounded-2xl text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={handleFinishStory}
                    disabled={isReading}
                    data-testid="button-completed-reading"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" />
                      <span>I Completed Reading</span>
                    </div>
                  </Button>

                  <Button
                    className="rounded-2xl text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={handleFinishStory}
                    disabled={isReading}
                    data-testid="button-play-games"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-6 h-6" />
                      <span>Play Games</span>
                    </div>
                  </Button>
                </div>
              </motion.div>
            )}
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
