import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuizGame } from "./QuizGame";
import { WordMatchingGame } from "./WordMatchingGame";
import { MemoryGame } from "./MemoryGame";
import { DrawingPuzzle } from "./DrawingPuzzle";
import { GameResult } from "@shared/schema";
import { Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyTitle: string;
  storyContent: string;
  onGameComplete: (result: GameResult) => void;
  isOptional?: boolean;
}

type GameType = "quiz" | "wordMatching" | "memory" | "drawing";

const GAME_NAMES = {
  quiz: "Story Quiz",
  wordMatching: "Word Matching",
  memory: "Memory Game",
  drawing: "Drawing Puzzle",
};

export function GameModal({
  open,
  onOpenChange,
  storyId,
  storyTitle,
  storyContent,
  onGameComplete,
  isOptional = false,
}: GameModalProps) {
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [earnedBadge, setEarnedBadge] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !gameType) {
      const games: GameType[] = ["quiz", "wordMatching", "memory", "drawing"];
      const randomGame = games[Math.floor(Math.random() * games.length)];
      setGameType(randomGame);
    }
  }, [open, gameType]);

  const handleGameComplete = async (result: GameResult) => {
    setGameResult(result);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/games/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error("Failed to submit game");
      }

      const data = await response.json();
      
      if (data.passed) {
        setEarnedBadge(true);
        toast({
          title: "Badge Earned!",
          description: `You earned the ${GAME_NAMES[result.gameType]} badge!`,
        });
      }
      
      setShowResult(true);
      onGameComplete(result);
    } catch (error) {
      console.error("Error submitting game:", error);
      toast({
        title: "Error",
        description: "Failed to save your game progress",
        variant: "destructive",
      });
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isOptional && !showResult) {
      return;
    }
    setGameType(null);
    setShowResult(false);
    setGameResult(null);
    setEarnedBadge(false);
    onOpenChange(false);
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setGameResult(null);
    setEarnedBadge(false);
    const games: GameType[] = ["quiz", "wordMatching", "memory", "drawing"];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    setGameType(randomGame);
  };

  if (!gameType) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={isOptional || showResult ? handleClose : undefined}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        data-testid="dialog-game-modal"
        onPointerDownOutside={(e) => {
          if (!isOptional && !showResult) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!isOptional && !showResult) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            {GAME_NAMES[gameType]}
          </DialogTitle>
        </DialogHeader>

        {!showResult && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {isOptional 
                ? "Play this fun game to earn a special badge!" 
                : "Complete this game to continue reading more stories!"}
            </p>

            {gameType === "quiz" && (
              <QuizGame
                storyId={storyId}
                storyTitle={storyTitle}
                storyContent={storyContent}
                onComplete={handleGameComplete}
              />
            )}

            {gameType === "wordMatching" && (
              <WordMatchingGame
                storyId={storyId}
                storyTitle={storyTitle}
                storyContent={storyContent}
                onComplete={handleGameComplete}
              />
            )}

            {gameType === "memory" && (
              <MemoryGame
                storyId={storyId}
                storyTitle={storyTitle}
                storyContent={storyContent}
                onComplete={handleGameComplete}
              />
            )}

            {gameType === "drawing" && (
              <DrawingPuzzle
                storyId={storyId}
                storyTitle={storyTitle}
                storyContent={storyContent}
                onComplete={handleGameComplete}
              />
            )}
          </div>
        )}

        {showResult && gameResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-8 text-center"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <Trophy className="w-24 h-24 text-yellow-500" />
            </motion.div>

            <div>
              <h3 className="text-3xl font-bold mb-2">Great Job!</h3>
              <p className="text-xl text-muted-foreground">
                You scored {gameResult.score} out of {gameResult.totalScore}
              </p>
            </div>

            {earnedBadge && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                  <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
                    Badge Earned!
                  </h4>
                </div>
                <p className="text-yellow-700 dark:text-yellow-400">
                  {GAME_NAMES[gameType]} Master Badge
                </p>
              </motion.div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={handlePlayAgain}
                variant="default"
                size="lg"
                data-testid="button-play-again"
              >
                Play Another Game
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                size="lg"
                data-testid="button-continue"
              >
                {isOptional ? "Close" : "Continue"}
              </Button>
            </div>
          </motion.div>
        )}

        {!showResult && isOptional && (
          <div className="flex justify-end">
            <Button
              onClick={handleClose}
              variant="ghost"
              data-testid="button-skip-game"
            >
              Skip Game
            </Button>
          </div>
        )}
      </DialogContent>

      <audio autoPlay loop className="hidden">
        <source src="/calm-music.mp3" type="audio/mpeg" />
      </audio>
    </Dialog>
  );
}
