import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameResult } from "@shared/schema";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizGameProps {
  storyId: string;
  storyTitle: string;
  storyContent: string;
  onComplete: (result: GameResult) => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export function QuizGame({ storyId, storyTitle, storyContent, onComplete }: QuizGameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const generatedQuestions = generateQuestions(storyTitle, storyContent);
    setQuestions(generatedQuestions);
  }, [storyTitle, storyContent]);

  const generateQuestions = (title: string, content: string): Question[] => {
    const words = content.split(" ");
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    const questions: Question[] = [];
    
    if (sentences.length >= 3) {
      questions.push({
        question: "What is this story about?",
        options: [
          title,
          "A different adventure",
          "A cooking recipe",
          "A science lesson"
        ],
        correctAnswer: 0,
      });
    }

    if (words.length > 20) {
      const randomWord = words[Math.floor(words.length / 2)];
      questions.push({
        question: `Which word appeared in the story?`,
        options: [randomWord, "rainbow", "computer", "telephone"],
        correctAnswer: 0,
      });
    }

    if (sentences.length >= 2) {
      questions.push({
        question: "How did the story make you feel?",
        options: ["Happy", "Sad", "Excited", "All of the above"],
        correctAnswer: 3,
      });
    }

    return questions.slice(0, 3);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        const finalScore = answerIndex === questions[currentQuestion].correctAnswer ? score + 1 : score;
        onComplete({
          storyId,
          gameType: "quiz",
          score: finalScore,
          totalScore: questions.length,
        });
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6" data-testid="game-quiz">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium">
          Score: {score}/{questions.length}
        </span>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant={showCorrect ? "default" : showIncorrect ? "destructive" : "outline"}
                    className={`w-full justify-start text-left h-auto py-4 px-6 ${
                      showCorrect ? "bg-green-500 hover:bg-green-600" : ""
                    }`}
                    onClick={() => handleAnswer(index)}
                    disabled={showFeedback}
                    data-testid={`button-answer-${index}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="flex-1">{option}</span>
                      {showCorrect && <CheckCircle2 className="w-5 h-5" />}
                      {showIncorrect && <XCircle className="w-5 h-5" />}
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
