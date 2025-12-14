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
    // Prioritize voiceoverUrl (parent's recorded voice) over audioUrl (AI/uploaded audio)
    const audioSource = currentStory?.voiceoverUrl || currentStory?.audioUrl;
    
    if (!currentStory || !audioSource) return;

    stopReading();

    let audioUrl = audioSource;
    if (audioSource.startsWith('http') || audioSource.startsWith('/')) {
      audioUrl = currentStory.id ? `/api/audio-proxy/${currentStory.id}` : audioSource;
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
      className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 relative overflow-hidden"
    >
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
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
            {currentStory.title}
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

        {/* Main Content */}
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
                    story={currentStory} 
                    onComplete={handleGameComplete}
                    onNextStory={nextStory}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 max-w-4xl mx-auto"
              >
                {/* Story Content Box */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-gray-200 dark:border-gray-700">
                  <p 
                    className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap"
                    data-testid="text-current-story-content"
                  >
                    {currentStory.content}
                  </p>
                </div>

                {/* PDF Viewer */}
                {currentStory.pdfUrl && (
                  <div className="w-full rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                    <PDFViewer pdfUrl={`/api/pdf-proxy/${currentStory.id}`} height="500px" />
                  </div>
                )}

                {/* Story Image */}
                {currentStory.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentStory.imageUrl}
                      alt={currentStory.title}
                      className="w-full max-w-md h-auto rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 object-cover"
                      data-testid="img-current-story"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  {/* Read Button */}
                  <Button
                    className="rounded-2xl text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={isReading ? stopReading : startReading}
                    disabled={!currentStory.voiceoverUrl && !currentStory.audioUrl && !isReading}
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
                          <span>{(currentStory.voiceoverUrl || currentStory.audioUrl) ? "Read to Me" : "No Recording"}</span>
                        </>
                      )}
                    </div>
                  </Button>

                  {/* I Completed Reading Button */}
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

                  {/* Play Games Button */}
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

      {/* PIN Dialog */}
      <PINDialog
        open={showPINDialog}
        onOpenChange={setShowPINDialog}
        onVerify={handleVerifyPIN}
        title="Exit Child Mode"
        description="Enter parent PIN to return to dashboard"
      />

      {/* Rewards Dialog */}
      <RewardsDialog
        open={showRewardsDialog}
        onOpenChange={setShowRewardsDialog}
        checkpoints={checkpointProgress}
        newlyEarned={newlyEarnedRewards}
      />
    </div>
  );
}
