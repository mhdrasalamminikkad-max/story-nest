import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameResult } from "@shared/schema";
import { motion } from "framer-motion";

interface WordMatchingGameProps {
  storyId: string;
  storyTitle: string;
  storyContent: string;
  onComplete: (result: GameResult) => void;
}

interface WordPair {
  word: string;
  match: string;
}

export function WordMatchingGame({ storyId, storyTitle, storyContent, onComplete }: WordMatchingGameProps) {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [shuffledMatches, setShuffledMatches] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);

  useEffect(() => {
    const pairs = generateWordPairs(storyContent);
    setWordPairs(pairs);
    const matches = [...pairs.map(p => p.match)].sort(() => Math.random() - 0.5);
    setShuffledMatches(matches);
  }, [storyContent]);

  const generateWordPairs = (content: string): WordPair[] => {
    const words = content.split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = Array.from(new Set(words)).slice(0, 5);

    return uniqueWords.map(word => ({
      word: word.toLowerCase(),
      match: word.toLowerCase(),
    }));
  };

  const handleWordClick = (index: number) => {
    if (matchedPairs.has(index)) return;
    setSelectedWord(index);
  };

  const handleMatchClick = (index: number) => {
    if (selectedWord === null) return;
    
    const isCorrect = wordPairs[selectedWord].match === shuffledMatches[index];
    
    if (isCorrect) {
      setMatchedPairs(new Set([...Array.from(matchedPairs), selectedWord]));
      setScore(score + 1);
      
      if (matchedPairs.size + 1 === wordPairs.length) {
        setTimeout(() => {
          onComplete({
            storyId,
            gameType: "wordMatching",
            score: score + 1,
            totalScore: wordPairs.length,
          });
        }, 500);
      }
    }

    setSelectedWord(null);
    setSelectedMatch(null);
  };

  if (wordPairs.length === 0) {
    return <div className="text-center py-8">Loading game...</div>;
  }

  return (
    <div className="space-y-6" data-testid="game-word-matching">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Match the words from the story
        </span>
        <span className="text-sm font-medium">
          Matched: {matchedPairs.size}/{wordPairs.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-center mb-4">Words</h4>
          {wordPairs.map((pair, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: matchedPairs.has(index) ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`p-4 text-center cursor-pointer transition-colors ${
                  matchedPairs.has(index)
                    ? "bg-green-100 dark:bg-green-900/20 opacity-50"
                    : selectedWord === index
                    ? "bg-primary text-primary-foreground"
                    : "hover-elevate"
                }`}
                onClick={() => handleWordClick(index)}
                data-testid={`word-${index}`}
              >
                <p className="font-medium">{pair.word}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-center mb-4">Match</h4>
          {shuffledMatches.map((match, index) => {
            const isMatched = matchedPairs.has(wordPairs.findIndex(p => p.match === match));
            return (
              <motion.div
                key={index}
                whileHover={{ scale: isMatched ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  className={`p-4 text-center cursor-pointer transition-colors ${
                    isMatched
                      ? "bg-green-100 dark:bg-green-900/20 opacity-50"
                      : selectedMatch === index
                      ? "bg-primary text-primary-foreground"
                      : "hover-elevate"
                  }`}
                  onClick={() => handleMatchClick(index)}
                  data-testid={`match-${index}`}
                >
                  <p className="font-medium">{match}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
