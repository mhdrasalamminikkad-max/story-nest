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

function extractKeyWords(content: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that",
    "these", "those", "i", "you", "he", "she", "we", "they", "what", "which", "who",
    "when", "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "just", "also", "now", "here", "there", "then", "once",
    "her", "his", "him", "my", "your", "our", "their", "me", "us", "them", "into",
    "said", "says", "went", "came", "got", "one", "two", "three", "about", "after",
    "before", "over", "under", "again", "further", "while", "being", "having", "doing"
  ]);
  
  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && w.length <= 10 && !stopWords.has(w));
  
  const wordFreq = new Map<string, number>();
  words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function extractSentences(content: string): string[] {
  return content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 20 && s.length <= 120);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function deduplicateOptions(options: string[], correctAnswer: string): { options: string[]; correctIndex: number } {
  const unique = new Map<string, string>();
  
  unique.set(correctAnswer.toLowerCase().trim(), correctAnswer);
  
  for (const opt of options) {
    const key = opt.toLowerCase().trim();
    if (!unique.has(key) && unique.size < 4) {
      unique.set(key, opt);
    }
  }
  
  const fallbacks = ["Something else", "None of these", "A different one", "Another option"];
  for (const fb of fallbacks) {
    if (unique.size < 4 && !unique.has(fb.toLowerCase())) {
      unique.set(fb.toLowerCase(), fb);
    }
  }
  
  const result = shuffleArray(Array.from(unique.values()));
  return { 
    options: result, 
    correctIndex: result.findIndex(o => o.toLowerCase().trim() === correctAnswer.toLowerCase().trim())
  };
}

function generateQuizQuestions(story: Story) {
  const sentences = extractSentences(story.content);
  const keyWords = extractKeyWords(story.content);
  
  const questions: { question: string; options: string[]; correct: number }[] = [];
  
  const titleVariations = [
    `The ${keyWords[1] || 'Little'} ${keyWords[2] || 'Adventure'}`,
    `A ${keyWords[3] || 'Magical'} ${keyWords[4] || 'Journey'}`,
    `${keyWords[5]?.charAt(0).toUpperCase()}${keyWords[5]?.slice(1) || 'Happy'}'s ${keyWords[6] || 'Story'}`,
  ];
  const titleResult = deduplicateOptions([story.title, ...titleVariations], story.title);
  questions.push({
    question: "What is this story called?",
    options: titleResult.options,
    correct: titleResult.correctIndex
  });
  
  if (story.category) {
    const fakeCategories = ["Cooking", "Sports", "Science", "Travel", "Music", "History", "Nature"]
      .filter(c => c.toLowerCase() !== story.category?.toLowerCase());
    const catResult = deduplicateOptions([story.category, ...fakeCategories], story.category);
    questions.push({
      question: "What type of story is this?",
      options: catResult.options,
      correct: catResult.correctIndex
    });
  }
  
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    const fakeSentences = sentences.slice(1, 4);
    while (fakeSentences.length < 3) {
      fakeSentences.push(`The ${keyWords[fakeSentences.length] || 'story'} began differently`);
    }
    const sentResult = deduplicateOptions([firstSentence, ...fakeSentences], firstSentence);
    
    const displayOptions: string[] = [];
    const seenDisplays = new Set<string>();
    for (let i = 0; i < sentResult.options.length; i++) {
      const full = sentResult.options[i];
      let display = full.length > 50 ? full.substring(0, 50) + "..." : full;
      
      if (seenDisplays.has(display.toLowerCase())) {
        display = full.length > 60 ? full.substring(0, 60) + "..." : full;
      }
      if (seenDisplays.has(display.toLowerCase())) {
        display = `(${i + 1}) ${display}`;
      }
      
      seenDisplays.add(display.toLowerCase());
      displayOptions.push(display);
    }
    
    questions.push({
      question: "How does the story begin?",
      options: displayOptions,
      correct: sentResult.correctIndex
    });
  }
  
  if (keyWords.length >= 4) {
    const storyWord = keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1);
    const similarWords = keyWords.slice(4, 7).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    const fakeWords = ["Elephant", "Bicycle", "Mountain", "Rainbow"]
      .filter(w => !keyWords.includes(w.toLowerCase()));
    const distractors = [...similarWords, ...fakeWords];
    const wordResult = deduplicateOptions([storyWord, ...distractors], storyWord);
    questions.push({
      question: "Which word appears in this story?",
      options: wordResult.options,
      correct: wordResult.correctIndex
    });
  }
  
  return questions.slice(0, 3);
}

function generateMemoryCards(story: Story) {
  const keyWords = extractKeyWords(story.content);
  const wordsToUse = keyWords.slice(0, 4).map(w => w.substring(0, 6).toUpperCase());
  
  while (wordsToUse.length < 4) {
    const fallback = ["STORY", "HAPPY", "MAGIC", "DREAM"];
    wordsToUse.push(fallback[wordsToUse.length]);
  }
  
  const cards = [...wordsToUse, ...wordsToUse].map((word, i) => ({
    id: i,
    word,
    isFlipped: false,
    isMatched: false
  }));
  
  return shuffleArray(cards);
}

function generatePuzzleData(story: Story) {
  const keyWords = extractKeyWords(story.content);
  const uniqueWords = new Set<string>();
  const words: string[] = [];
  
  for (const word of keyWords) {
    const truncated = word.substring(0, 6).toUpperCase();
    if (!uniqueWords.has(truncated) && words.length < 9) {
      uniqueWords.add(truncated);
      words.push(truncated);
    }
  }
  
  const fallback = ["STORY", "MAGIC", "DREAM", "HAPPY", "BRAVE", "KINDR", "WONDER", "HOPE", "SHINE"];
  for (const fb of fallback) {
    if (!uniqueWords.has(fb) && words.length < 9) {
      uniqueWords.add(fb);
      words.push(fb);
    }
  }
  
  const sortedWords = [...words].sort((a, b) => a.localeCompare(b));
  
  const pieces = words.map((word, i) => ({
    id: `piece-${i}-${word}`,
    word: word,
  }));
  
  let shuffled = shuffleArray([...pieces]);
  let attempts = 0;
  while (shuffled.every((p, i) => p.word === sortedWords[i]) && attempts < 20) {
    shuffled = shuffleArray([...pieces]);
    attempts++;
  }
  
  return { pieces: shuffled, sortedWords };
}

function generateWordBuilderData(story: Story) {
  const keyWords = extractKeyWords(story.content);
  const suitableWords = keyWords.filter(w => w.length >= 4 && w.length <= 7);
  
  const word = suitableWords.length > 0 
    ? suitableWords[Math.floor(Math.random() * Math.min(3, suitableWords.length))].toUpperCase()
    : "STORY";
  
  const letters = shuffleArray(word.split(''));
  return { word, letters, hint: `A word from the story (${word.length} letters)` };
}

function generateFillInBlanks(story: Story) {
  const sentences = extractSentences(story.content);
  const keyWords = extractKeyWords(story.content);
  const results: { text: string; answer: string; options: string[] }[] = [];
  
  for (let i = 0; i < Math.min(3, sentences.length); i++) {
    const sentence = sentences[i];
    const words = sentence.split(' ').filter(w => w.length >= 4);
    
    if (words.length > 0) {
      const targetWord = words[Math.floor(Math.random() * words.length)].replace(/[^a-zA-Z]/g, '');
      if (targetWord.length >= 4) {
        const blankedSentence = sentence.replace(
          new RegExp(`\\b${targetWord}\\b`, 'i'),
          '___'
        );
        
        const fakeOptions = keyWords
          .filter(w => w.toLowerCase() !== targetWord.toLowerCase())
          .slice(0, 2);
        while (fakeOptions.length < 2) {
          fakeOptions.push(["magic", "happy", "story"][fakeOptions.length]);
        }
        
        const opts = shuffleArray([targetWord.toLowerCase(), ...fakeOptions]);
        results.push({
          text: blankedSentence,
          answer: targetWord.toLowerCase(),
          options: opts
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      text: `The story "${story.title}" was full of ___ and wonder.`,
      answer: "magic",
      options: shuffleArray(["magic", "cold", "sad"])
    });
    results.push({
      text: "Everyone in the story lived ___ ever after.",
      answer: "happily",
      options: shuffleArray(["happily", "sadly", "quickly"])
    });
  }
  
  return results;
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

function MemoryGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [cards, setCards] = useState(() => generateMemoryCards(story));
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
      if (cards[first].word === cards[second].word) {
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
        <span className="text-lg font-bold">Match words from the story!</span>
        <span className="text-lg">Found: {matches}/4</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(i)}
            className={`aspect-square rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold cursor-pointer transition-all p-1 ${
              card.isFlipped || card.isMatched 
                ? "bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg" 
                : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700"
            } ${card.isMatched ? "opacity-60" : ""}`}
            data-testid={`card-memory-${i}`}
          >
            {(card.isFlipped || card.isMatched) ? card.word : "?"}
          </motion.div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Moves: {moves}</p>
    </div>
  );
}

function PuzzleGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [data] = useState(() => generatePuzzleData(story));
  const [pieces, setPieces] = useState(data.pieces);
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
      
      const isSorted = newPieces.every((p, i) => p.word === data.sortedWords[i]);
      if (isSorted) {
        setTimeout(onWin, 500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Sort words A to Z</span>
        <span className="text-lg">Moves: {moves}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {pieces.map((piece, i) => {
          const isCorrect = piece.word === data.sortedWords[i];
          return (
            <motion.div
              key={piece.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePieceClick(i)}
              className={`aspect-square rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold cursor-pointer shadow-lg p-1 ${
                isCorrect 
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white ring-2 ring-green-300" 
                  : "bg-gradient-to-br from-purple-400 to-pink-500 text-white"
              } ${selected === i ? "ring-4 ring-yellow-300" : ""}`}
              data-testid={`piece-puzzle-${i}`}
            >
              {piece.word}
            </motion.div>
          );
        })}
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Tap two words to swap. Put them in ABC order (top-left to bottom-right).
        <br />
        <span className="text-green-500">Green = Correct position</span>
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

function getWordRoot(word: string): string {
  return word.toLowerCase()
    .replace(/ies$/i, 'y')
    .replace(/es$/i, '')
    .replace(/s$/i, '')
    .replace(/ed$/i, '')
    .replace(/ing$/i, '')
    .replace(/er$/i, '')
    .replace(/est$/i, '')
    .replace(/ly$/i, '');
}

function areWordsSimilar(word1: string, word2: string): boolean {
  const r1 = getWordRoot(word1);
  const r2 = getWordRoot(word2);
  if (r1 === r2) return true;
  if (r1.includes(r2) || r2.includes(r1)) return true;
  if (Math.abs(r1.length - r2.length) <= 1 && r1.substring(0, 3) === r2.substring(0, 3)) return true;
  return false;
}

function generateSpotDifferenceData(story: Story) {
  const keyWords = extractKeyWords(story.content);
  
  const contrastPairs = [
    ["FOREST", "OCEAN"], ["MOUNTAIN", "VALLEY"], ["NIGHT", "DAY"],
    ["HAPPY", "QUIET"], ["BRAVE", "GENTLE"], ["MAGIC", "SIMPLE"],
    ["CASTLE", "COTTAGE"], ["DRAGON", "BUNNY"], ["KING", "FARMER"]
  ];
  
  const storyPairs: Array<{ original: string; changed: string }> = [];
  
  for (let i = 0; i < keyWords.length && storyPairs.length < 3; i++) {
    for (let j = i + 3; j < keyWords.length && storyPairs.length < 3; j++) {
      if (!areWordsSimilar(keyWords[i], keyWords[j]) && 
          keyWords[i].length >= 3 && keyWords[j].length >= 3) {
        storyPairs.push({
          original: keyWords[i].toUpperCase(),
          changed: keyWords[j].toUpperCase()
        });
      }
    }
  }
  
  while (storyPairs.length < 3) {
    const pair = contrastPairs[storyPairs.length % contrastPairs.length];
    storyPairs.push({ original: pair[0], changed: pair[1] });
  }
  
  const diffIndices = shuffleArray([0, 1, 2]).slice(0, 2);
  
  return {
    items: storyPairs.slice(0, 3).map((p, i) => ({
      id: i,
      original: p.original,
      display: diffIndices.includes(i) ? p.changed : p.original,
      isDifferent: diffIndices.includes(i)
    })),
    totalDifferences: 2
  };
}

function SpotDifferenceGame({ story, onWin }: { story: Story; onWin: () => void }) {
  const [data] = useState(() => generateSpotDifferenceData(story));
  const [found, setFound] = useState<number[]>([]);
  const [wrongClicks, setWrongClicks] = useState(0);

  const handleClick = (id: number, isDifferent: boolean) => {
    if (found.includes(id)) return;
    
    if (isDifferent) {
      const newFound = [...found, id];
      setFound(newFound);
      if (newFound.length === data.totalDifferences) {
        setTimeout(onWin, 500);
      }
    } else {
      setWrongClicks(w => w + 1);
    }
  };

  const colors = [
    { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-800 dark:text-blue-200" },
    { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-800 dark:text-purple-200" },
    { bg: "bg-pink-100 dark:bg-pink-900/50", text: "text-pink-800 dark:text-pink-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">Find the different words!</span>
        <span className="text-lg">Found: {found.length}/{data.totalDifferences}</span>
      </div>
      
      <div className="space-y-4">
        {data.items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-2 gap-4">
            <div className={`p-4 ${colors[index].bg} rounded-xl text-center`}>
              <div className="text-xs text-muted-foreground mb-2">Original Word</div>
              <div className={`text-xl font-bold ${colors[index].text}`}>{item.original}</div>
            </div>
            
            <motion.div
              className={`p-4 rounded-xl cursor-pointer transition-all text-center ${
                found.includes(item.id)
                  ? "bg-green-100 dark:bg-green-900/50 ring-4 ring-green-500"
                  : `${colors[index].bg} hover:ring-2 hover:ring-yellow-400`
              }`}
              onClick={() => handleClick(item.id, item.isDifferent)}
              whileTap={{ scale: 0.98 }}
              data-testid={`spot-diff-${item.id}`}
            >
              <div className="text-xs text-muted-foreground mb-2">
                {found.includes(item.id) ? "Different!" : "Same or Different?"}
              </div>
              <div className={`text-xl font-bold ${found.includes(item.id) ? "text-green-700 dark:text-green-300" : colors[index].text}`}>
                {found.includes(item.id) && <Check className="w-5 h-5 inline mr-1" />}
                {item.display}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Compare each pair. Tap the right box if the word is DIFFERENT from the left.
        {wrongClicks > 0 && <span className="block text-orange-500 mt-1">Wrong taps: {wrongClicks}</span>}
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
        {selectedGame === "memory" && <MemoryGame story={story} onWin={handleGameWin} />}
        {selectedGame === "puzzle" && <PuzzleGame story={story} onWin={handleGameWin} />}
        {selectedGame === "wordbuilder" && <WordBuilderGame story={story} onWin={handleGameWin} />}
        {selectedGame === "fillin" && <FillInBlankGame story={story} onWin={handleGameWin} />}
        {selectedGame === "spotdiff" && <SpotDifferenceGame story={story} onWin={handleGameWin} />}
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
