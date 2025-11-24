import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { Story } from "@shared/schema";
import { useRef } from "react";

type GameType = "quiz" | "wordMatching" | "memory" | "drawing";

interface PostStoryGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: Story;
  isChild: boolean;
  onComplete: (badgeEarned: boolean) => void;
}

// Generate calm ambient sound using Web Audio API
const generateCalmSound = (): string => {
  // Minimal calm tone - pure data URL for best compatibility
  return "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==";
};

export function PostStoryGame({ open, onOpenChange, story, isChild, onComplete }: PostStoryGameProps) {
  const [gameType, setGameType] = useState<GameType>("quiz");
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Auto-generate game type for children, optional for parents
    if (isChild && open && !gameStarted) {
      const gameTypes: GameType[] = ["quiz", "wordMatching", "memory", "drawing"];
      const randomGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
      setGameType(randomGame);
      setGameStarted(true);
      playCalmSound();
    }
  }, [open, isChild, gameStarted]);

  const playCalmSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => console.log("Audio play failed"));
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onOpenChange(false);
    onComplete(false);
  };

  const handleComplete = async () => {
    // Award badge
    try {
      await fetch("/api/badge-earned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          gameType,
          score,
        }),
      });
    } catch (error) {
      console.error("Error awarding badge:", error);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onOpenChange(false);
    onComplete(true);
  };

  const quizQuestions = [
    {
      question: "What was the main character's name?",
      options: ["Character A", "Character B", "Unknown"],
      correct: 0,
    },
    {
      question: "What was the main conflict in the story?",
      options: ["Option A", "Option B", "Option C"],
      correct: 1,
    },
    {
      question: "How did the story end?",
      options: ["Happy", "Sad", "Cliffhanger"],
      correct: 0,
    },
  ];

  return (
    <>
      <audio
        ref={audioRef}
        src={generateCalmSound()}
        loop
        preload="auto"
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 border-2 border-purple-200 dark:border-purple-700">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-purple-600 dark:text-purple-300">
            Story Game Time!
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!gameStarted ? (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-center text-gray-700 dark:text-gray-200">
                {isChild
                  ? "A game is waiting for you! Play to earn a badge!"
                  : "Choose a game to play after this story"}
              </p>
              {!isChild && (
                <div className="grid grid-cols-2 gap-3">
                  {["quiz", "wordMatching", "memory", "drawing"].map((game) => (
                    <Button
                      key={game}
                      variant={gameType === game ? "default" : "outline"}
                      onClick={() => setGameType(game as GameType)}
                      className="rounded-lg text-sm"
                    >
                      {game === "quiz" && "Quiz"}
                      {game === "wordMatching" && "Word Match"}
                      {game === "memory" && "Memory"}
                      {game === "drawing" && "Drawing"}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip
                </Button>
                <Button
                  onClick={() => setGameStarted(true)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  Play
                </Button>
              </div>
            </motion.div>
          ) : gameType === "quiz" && !showResult ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Question {currentQuestion + 1} of {quizQuestions.length}
                </p>
                <h3 className="mt-2 font-semibold text-gray-800 dark:text-gray-100">
                  {quizQuestions[currentQuestion].question}
                </h3>
              </div>
              <div className="space-y-2">
                {quizQuestions[currentQuestion].options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      if (idx === quizQuestions[currentQuestion].correct) {
                        setScore(score + 1);
                      }
                      if (currentQuestion < quizQuestions.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                      } else {
                        setShowResult(true);
                      }
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center"
            >
              <div className="text-6xl">🏆</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                Congratulations!
              </h3>
              <p className="text-gray-700 dark:text-gray-200">
                You scored {score} out of {quizQuestions.length}!
              </p>
              <Card className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 p-4">
                <p className="font-bold text-amber-900 dark:text-amber-100">
                  New Badge Earned: Story Master
                </p>
              </Card>
              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
    </>
  );
}
