import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { GameResult } from "@shared/schema";
import { motion } from "framer-motion";
import { Sparkles, Star, Heart, Music, Book, Sun } from "lucide-react";

interface MemoryGameProps {
  storyId: string;
  storyTitle: string;
  storyContent: string;
  onComplete: (result: GameResult) => void;
}

interface MemoryCard {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  { name: "sparkles", component: Sparkles },
  { name: "star", component: Star },
  { name: "heart", component: Heart },
  { name: "music", component: Music },
  { name: "book", component: Book },
  { name: "sun", component: Sun },
];

export function MemoryGame({ storyId, onComplete }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const selectedIcons = ICONS.slice(0, 4);
    const cardPairs = [...selectedIcons, ...selectedIcons]
      .map((icon, index) => ({
        id: index,
        icon: icon.name,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, isFlipped: true } : card
    );
    setCards(updatedCards);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === first || card.id === second
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatchedPairs(matchedPairs + 1);
          setFlippedCards([]);

          if (matchedPairs + 1 === 4) {
            setTimeout(() => {
              onComplete({
                storyId,
                gameType: "memory",
                score: Math.max(0, 20 - moves),
                totalScore: 20,
              });
            }, 500);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const icon = ICONS.find(i => i.name === iconName);
    return icon ? icon.component : Sparkles;
  };

  return (
    <div className="space-y-6" data-testid="game-memory">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Find matching pairs!
        </span>
        <span className="text-sm font-medium">
          Moves: {moves} | Pairs: {matchedPairs}/4
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => {
          const IconComponent = getIconComponent(card.icon);
          return (
            <motion.div
              key={card.id}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`aspect-square flex items-center justify-center cursor-pointer transition-all ${
                  card.isFlipped || card.isMatched
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover-elevate"
                } ${card.isMatched ? "opacity-50" : ""}`}
                onClick={() => handleCardClick(card.id)}
                data-testid={`memory-card-${card.id}`}
              >
                {card.isFlipped || card.isMatched ? (
                  <IconComponent className="w-8 h-8" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-muted" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
