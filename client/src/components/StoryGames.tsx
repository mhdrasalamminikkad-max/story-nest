import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, 
  Puzzle, 
  Brain, 
  Type, 
  Eye, 
  Grid3X3, 
  Search, 
  PenTool,
  Star,
  Trophy,
  ChevronRight,
  RotateCcw,
  Check,
  X as XIcon
} from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryGamesProps {
  story: Story;
  onComplete: () => void;
  onNextStory: () => void;
}

type GameType = "quiz" | "memory" | "puzzle" | "wordbuilder" | "fillin" | "hidden" | "spotdiff";

interface GameOption {
  id: GameType;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const gameOptions: GameOption[] = [
  { id: "quiz", title: "Quiz", icon: <Brain className="w-8 h-8" />, color: "from-purple-500 to-indigo-500", description: "Answer questions about the story" },
  { id: "memory", title: "Memory Cards", icon: <Grid3X3 className="w-8 h-8" />, color: "from-pink-500 to-rose-500", description: "Match the pairs" },
  { id: "puzzle", title: "Picture Puzzle", icon: <Puzzle className="w-8 h-8" />, color: "from-orange-500 to-amber-500", description: "Arrange the pieces" },
  { id: "wordbuilder", title: "Word Builder", icon: <Type className="w-8 h-8" />, color: "from-green-500 to-emerald-500", description: "Build words from the story" },
  { id: "fillin", title: "Fill in the Blank", icon: <PenTool className="w-8 h-8" />, color: "from-blue-500 to-cyan-500", description: "Complete the sentences" },
  { id: "spotdiff", title: "Spot Difference", icon: <Search className="w-8 h-8" />, color: "from-teal-500 to-green-500", description: "Find what's different" },
];

function generateQuizQuestions(story: Story) {
  const words = story.content.split(/\s+/).filter(w => w.length > 3);
  const sentences = story.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const questions = [
    {
      question: `What is the title of this story?`,
      options: [story.title, "The Magic Garden", "A Wonderful Day", "The Little Star"],
      correct: 0
    },
    {
      question: `Which category does this story belong to?`,
      options: [story.category || "Adventure", "Cooking", "Sports", "Science"],
      correct: 0
    },
    {
      question: `This story is about...`,
      options: [
        sentences[0]?.trim().substring(0, 50) + "..." || "A magical adventure",
        "A trip to the moon",
        "Making new friends",
        "Learning to fly"
      ],
      correct: 0
    }
  ];
  
  return questions.slice(0, 3);
}

function generateMemoryCards(story: Story) {
  const emojis = ["🌟", "🌈", "🦋", "🌸", "🎈", "🍀", "🌙", "⭐"];
  const pairs = emojis.slice(0, 4);
  const cards = [...pairs, ...pairs].map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false
  }));
  
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  return cards;
}

function generatePuzzlePieces() {
  const pieces = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

function generateWordBuilderData(story: Story) {
  const commonWords = ["STORY", "HAPPY", "MAGIC", "DREAM", "STARS", "HEART", "SMILE", "BRAVE"];
  const word = commonWords[Math.floor(Math.random() * commonWords.length)];
  const letters = word.split('').sort(() => Math.random() - 0.5);
  return { word, letters };
}

function generateFillInBlanks(story: Story) {
  const sentences = [
    { text: "The story was full of ___ and wonder.", answer: "magic", options: ["magic", "sad", "cold"] },
    { text: "Everyone lived ___ ever after.", answer: "happily", options: ["happily", "sadly", "quickly"] },
    { text: "The characters learned an important ___.", answer: "lesson", options: ["lesson", "recipe", "song"] }
  ];
  return sentences;
}

function QuizGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [questions] = useState(() => generateQuizQuestions(story));
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (index === questions[currentQ].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      onWin();
    } else {
      setCurrentQ(q => q + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Question {currentQ + 1}/{questions.length}</span>
        <span className="text-lg">Score: {score}/{questions.length}</span>
      </div>
      
      <Card className="p-6 bg-white/90 dark:bg-gray-800/90">
        <h3 className="text-xl font-bold mb-6 text-center">{questions[currentQ].question}</h3>
        <div className="grid grid-cols-1 gap-3">
          {questions[currentQ].options.map((option, i) => (
            <Button
              key={i}
              variant={answered ? (i === questions[currentQ].correct ? "default" : selectedAnswer === i ? "destructive" : "outline") : "outline"}
              className="py-4 text-lg justify-start"
              onClick={() => handleAnswer(i)}
              disabled={answered}
              data-testid={`button-quiz-option-${i}`}
            >
              {answered && i === questions[currentQ].correct && <Check className="w-5 h-5 mr-2" />}
              {answered && selectedAnswer === i && i !== questions[currentQ].correct && <XIcon className="w-5 h-5 mr-2" />}
              {option}
            </Button>
          ))}
        </div>
        {answered && (
          <Button onClick={nextQuestion} className="w-full mt-6" data-testid="button-next-question">
            {currentQ + 1 >= questions.length ? "Finish Game" : "Next Question"} <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </Card>
    </div>
  );
}

function MemoryGame({ onWin }: { onWin: () => void }) {
  const [cards, setCards] = useState(() => generateMemoryCards({} as Story));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;
    
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setMatches(m => m + 1);
          setFlipped([]);
          if (matches + 1 === 4) {
            setTimeout(onWin, 500);
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Matches: {matches}/4</span>
        <span className="text-lg">Moves: {moves}</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(i)}
            className={`aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all ${
              card.isFlipped || card.isMatched 
                ? "bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg" 
                : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700"
            } ${card.isMatched ? "opacity-60" : ""}`}
            data-testid={`card-memory-${i}`}
          >
            {(card.isFlipped || card.isMatched) ? card.emoji : "?"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PuzzleGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [pieces, setPieces] = useState(() => generatePuzzlePieces());
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const handlePieceClick = (index: number) => {
    if (selected === null) {
      setSelected(index);
    } else {
      const newPieces = [...pieces];
      [newPieces[selected], newPieces[index]] = [newPieces[index], newPieces[selected]];
      setPieces(newPieces);
      setSelected(null);
      setMoves(m => m + 1);
      
      if (newPieces.every((p, i) => p === i)) {
        setTimeout(onWin, 500);
      }
    }
  };

  const colors = [
    "from-red-400 to-red-500",
    "from-orange-400 to-orange-500", 
    "from-yellow-400 to-yellow-500",
    "from-green-400 to-green-500",
    "from-blue-400 to-blue-500",
    "from-indigo-400 to-indigo-500",
    "from-purple-400 to-purple-500",
    "from-pink-400 to-pink-500",
    "from-rose-400 to-rose-500"
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Arrange 1-9 in order</span>
        <span className="text-lg">Moves: {moves}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {pieces.map((piece, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePieceClick(i)}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer bg-gradient-to-br ${colors[piece]} text-white shadow-lg ${
              selected === i ? "ring-4 ring-white" : ""
            }`}
            data-testid={`piece-puzzle-${i}`}
          >
            {piece + 1}
          </motion.div>
        ))}
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Click two pieces to swap them
      </p>
    </div>
  );
}

function WordBuilderGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [data] = useState(() => generateWordBuilderData(story));
  const [selected, setSelected] = useState<number[]>([]);
  const [availableLetters, setAvailableLetters] = useState(data.letters);

  const handleLetterClick = (index: number) => {
    setSelected([...selected, index]);
    const newAvailable = [...availableLetters];
    newAvailable.splice(index, 1);
    setAvailableLetters(newAvailable);
  };

  const handleBuiltLetterClick = (index: number) => {
    const letterIndex = selected[index];
    setAvailableLetters([...availableLetters, data.letters[letterIndex]]);
    const newSelected = [...selected];
    newSelected.splice(index, 1);
    setSelected(newSelected);
  };

  const builtWord = selected.map(i => data.letters[i]).join('');
  const isCorrect = builtWord === data.word;

  useEffect(() => {
    if (isCorrect) {
      setTimeout(onWin, 1000);
    }
  }, [isCorrect, onWin]);

  const reset = () => {
    setSelected([]);
    setAvailableLetters(data.letters);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2">Build the word!</h3>
        <p className="text-sm text-muted-foreground">Hint: {data.word.length} letters</p>
      </div>
      
      <div className="flex justify-center gap-2 min-h-[60px] p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
        {selected.length === 0 ? (
          <span className="text-muted-foreground">Tap letters below</span>
        ) : (
          selected.map((letterIdx, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleBuiltLetterClick(i)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer ${
                isCorrect ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
              }`}
              data-testid={`letter-built-${i}`}
            >
              {data.letters[letterIdx]}
            </motion.div>
          ))
        )}
      </div>
      
      <div className="flex justify-center gap-2 flex-wrap">
        {availableLetters.map((letter, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleLetterClick(i)}
            className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-xl font-bold cursor-pointer shadow-lg"
            data-testid={`letter-available-${i}`}
          >
            {letter}
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button variant="outline" onClick={reset} data-testid="button-reset-word">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}

function FillInBlankGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [sentences] = useState(() => generateFillInBlanks(story));
  const [currentS, setCurrentS] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswer = (answer: string) => {
    if (answered) return;
    setSelectedAnswer(answer);
    setAnswered(true);
    if (answer === sentences[currentS].answer) {
      setScore(s => s + 1);
    }
  };

  const nextSentence = () => {
    if (currentS + 1 >= sentences.length) {
      onWin();
    } else {
      setCurrentS(s => s + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Sentence {currentS + 1}/{sentences.length}</span>
        <span className="text-lg">Score: {score}/{sentences.length}</span>
      </div>
      
      <Card className="p-6 bg-white/90 dark:bg-gray-800/90">
        <h3 className="text-xl font-bold mb-6 text-center">{sentences[currentS].text}</h3>
        <div className="flex justify-center gap-3 flex-wrap">
          {sentences[currentS].options.map((option, i) => (
            <Button
              key={i}
              variant={answered ? (option === sentences[currentS].answer ? "default" : selectedAnswer === option ? "destructive" : "outline") : "outline"}
              className="py-3 px-6 text-lg"
              onClick={() => handleAnswer(option)}
              disabled={answered}
              data-testid={`button-fillin-option-${i}`}
            >
              {option}
            </Button>
          ))}
        </div>
        {answered && (
          <Button onClick={nextSentence} className="w-full mt-6" data-testid="button-next-sentence">
            {currentS + 1 >= sentences.length ? "Finish Game" : "Next Sentence"} <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </Card>
    </div>
  );
}

function SpotDifferenceGame({ onWin }: { onWin: () => void }) {
  const [found, setFound] = useState<number[]>([]);
  const differences = [
    { id: 1, x: 25, y: 30 },
    { id: 2, x: 60, y: 50 },
    { id: 3, x: 80, y: 20 },
  ];

  const handleClick = (id: number) => {
    if (!found.includes(id)) {
      const newFound = [...found, id];
      setFound(newFound);
      if (newFound.length === differences.length) {
        setTimeout(onWin, 500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Find the differences!</span>
        <span className="text-lg">Found: {found.length}/{differences.length}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="relative aspect-square bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🏠</div>
          </div>
          <div className="absolute" style={{ left: "20%", top: "60%" }}>
            <div className="text-3xl">🌳</div>
          </div>
          <div className="absolute" style={{ left: "70%", top: "30%" }}>
            <div className="text-2xl">☀️</div>
          </div>
        </div>
        
        <div className="relative aspect-square bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🏠</div>
          </div>
          {differences.map(diff => (
            <motion.div
              key={diff.id}
              className={`absolute w-10 h-10 rounded-full cursor-pointer flex items-center justify-center ${
                found.includes(diff.id) 
                  ? "bg-green-500/50 ring-2 ring-green-500" 
                  : "hover:bg-white/20"
              }`}
              style={{ left: `${diff.x}%`, top: `${diff.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => handleClick(diff.id)}
              whileTap={{ scale: 0.9 }}
              data-testid={`spot-diff-${diff.id}`}
            >
              {found.includes(diff.id) ? <Check className="w-5 h-5 text-green-500" /> : (
                <span className="text-xl">
                  {diff.id === 1 ? "🌲" : diff.id === 2 ? "🌙" : "⭐"}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Tap on the differences in the right image
      </p>
    </div>
  );
}

export function StoryGames({ story, onComplete, onNextStory }: StoryGamesProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);

  const handleGameWin = useCallback(() => {
    setGameCompleted(true);
  }, []);

  const handleNextStory = () => {
    onComplete();
    onNextStory();
  };

  const handlePlayAgain = () => {
    setSelectedGame(null);
    setGameCompleted(false);
  };

  if (gameCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 py-8"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          <Trophy className="w-24 h-24 mx-auto text-yellow-500" />
        </motion.div>
        <h2 className="text-3xl font-bold text-primary">Great Job!</h2>
        <p className="text-lg text-muted-foreground">You completed the game!</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button variant="outline" onClick={handlePlayAgain} size="lg" className="rounded-2xl" data-testid="button-play-again">
            <RotateCcw className="w-5 h-5 mr-2" /> Play Another Game
          </Button>
          <Button onClick={handleNextStory} size="lg" className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500" data-testid="button-next-story-after-game">
            Next Story <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    );
  }

  if (selectedGame) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedGame(null)}
          className="mb-4"
          data-testid="button-back-to-games"
        >
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Back to Games
        </Button>
        
        {selectedGame === "quiz" && <QuizGame story={story} onWin={handleGameWin} />}
        {selectedGame === "memory" && <MemoryGame onWin={handleGameWin} />}
        {selectedGame === "puzzle" && <PuzzleGame story={story} onWin={handleGameWin} />}
        {selectedGame === "wordbuilder" && <WordBuilderGame story={story} onWin={handleGameWin} />}
        {selectedGame === "fillin" && <FillInBlankGame story={story} onWin={handleGameWin} />}
        {selectedGame === "spotdiff" && <SpotDifferenceGame onWin={handleGameWin} />}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Gamepad2 className="w-16 h-16 mx-auto text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">Story Complete!</h2>
        <p className="text-muted-foreground">Choose a fun game to play</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {gameOptions.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`p-4 cursor-pointer hover-elevate active-elevate-2 bg-gradient-to-br ${game.color} text-white border-none`}
              onClick={() => setSelectedGame(game.id)}
              data-testid={`button-game-${game.id}`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                {game.icon}
                <span className="font-bold text-sm">{game.title}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          variant="outline" 
          onClick={onNextStory}
          className="rounded-2xl"
          data-testid="button-skip-game"
        >
          Skip Game <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
