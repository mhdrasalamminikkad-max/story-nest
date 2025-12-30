import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ArrowLeft, Gamepad2, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@shared/schema";
import { PDFViewer } from "@/components/PDFViewer";
import { StoryGames } from "@/components/StoryGames";

export default function ParentStoryReadPage() {
  const [location, setLocation] = useLocation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const storyId = searchParams.get("story");

  const { data: stories = [], isLoading: loadingList } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: storyDetails, isLoading: loadingDetails } = useQuery<Story>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  const currentStory = storyDetails || stories.find((s) => s.id === storyId);
  const isLoading = loadingList || (!!storyId && loadingDetails && !currentStory);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!storyDetails) return;

    const audioSource = storyDetails.audioUrl || storyDetails.voiceoverUrl;
    
    if (audioSource) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioSource);
          audioRef.current.onended = () => setIsPlaying(false);
          audioRef.current.onerror = () => setIsPlaying(false);
        }
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else if (storyDetails.content) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(storyDetails.content);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };
  
  const isAudioPlaying = isPlaying || isSpeaking;

  const handleBack = () => {
    window.speechSynthesis.cancel();
    setLocation("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Story not found</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handlePdfLoaded = () => {
    if (storyDetails) {
      const audioSource = storyDetails.audioUrl || storyDetails.voiceoverUrl;
      if (audioSource && !isPlaying) {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioSource);
          audioRef.current.onended = () => setIsPlaying(false);
          audioRef.current.onerror = () => setIsPlaying(false);
        }
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  if (currentStory?.pdfUrl || storyDetails?.pdfUrl) {
    const pdfUrl = storyDetails?.pdfUrl || (currentStory?.pdfUrl ? `${currentStory.pdfUrl}` : null);
    if (pdfUrl) {
      return (
        <div className="h-screen flex flex-col bg-background">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h2 className="font-semibold text-lg truncate flex-1 text-center">
                {storyDetails?.title || currentStory?.title}
              </h2>
              <div className="w-[140px]"></div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <PDFViewer pdfUrl={pdfUrl} fillScreen onPdfLoaded={handlePdfLoaded} />
          </div>
          <div className="sticky bottom-0 flex justify-center py-4 bg-background/95 backdrop-blur-sm border-t">
            <Button
              variant={isAudioPlaying ? "destructive" : "default"}
              size="lg"
              onClick={toggleSpeech}
              data-testid="button-toggle-speech"
              className="rounded-2xl px-8 py-6"
            >
              {isAudioPlaying ? (
                <>
                  <VolumeX className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Read to Me
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between flex-wrap gap-4"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            data-testid="button-back"
            className="rounded-2xl"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isAudioPlaying ? "destructive" : "default"}
              onClick={toggleSpeech}
              data-testid="button-toggle-speech"
              className="rounded-2xl"
            >
              {isAudioPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop Reading
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Read Aloud
                </>
              )}
            </Button>
            
            <Button
              variant={showGames ? "secondary" : "outline"}
              onClick={() => setShowGames(!showGames)}
              data-testid="button-toggle-games"
              className="rounded-2xl"
            >
              {showGames ? (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Story
                </>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Preview Games
                </>
              )}
            </Button>
          </div>
        </motion.div>

          <AnimatePresence mode="wait">
            {showGames ? (
              <motion.div
                key="games"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-3xl shadow-xl p-6 md:p-10"
              >
                <StoryGames 
                  story={currentStory} 
                  onComplete={() => setShowGames(false)}
                  onNextStory={() => setShowGames(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="story"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-3xl shadow-xl p-6 md:p-10 space-y-6"
              >
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-heading text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  data-testid="text-story-title"
                >
                  {currentStory.title}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="prose prose-lg dark:prose-invert max-w-none"
                  data-testid="text-story-content"
                >
                  {currentStory.content.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 text-card-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}
