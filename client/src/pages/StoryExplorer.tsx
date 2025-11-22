import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Languages, 
  BookMarked, 
  Layers, 
  Sparkles,
  Globe,
  Flag,
  Star,
  History,
  Lightbulb,
  Map,
  GraduationCap,
  Wand2,
  BookText,
  Castle,
  Compass,
  Heart,
  Zap,
  Microscope
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@shared/schema";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Badge } from "@/components/ui/badge";

type StepType = "language" | "category" | "type" | "stories";

const languages = [
  { value: "english", label: "English", icon: Globe },
  { value: "malayalam", label: "Malayalam", icon: Flag },
];

const categories = [
  { value: "islamic", label: "Islamic", icon: Star },
  { value: "history", label: "History", icon: History },
  { value: "moral", label: "Moral Lessons", icon: Lightbulb },
  { value: "adventure", label: "Adventure", icon: Map },
  { value: "educational", label: "Educational", icon: GraduationCap },
  { value: "fairy-tale", label: "Fairy Tale", icon: Wand2 },
];

const storyTypes = [
  { value: "islamic", label: "Islamic", icon: Star },
  { value: "lesson", label: "Lesson", icon: BookText },
  { value: "history", label: "History", icon: Castle },
  { value: "fairy-tale", label: "Fairy Tale", icon: Sparkles },
  { value: "adventure", label: "Adventure", icon: Compass },
  { value: "educational", label: "Educational", icon: GraduationCap },
  { value: "moral", label: "Moral", icon: Heart },
  { value: "mythology", label: "Mythology", icon: Zap },
  { value: "science", label: "Science", icon: Microscope },
];

export default function StoryExplorer() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<StepType>("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories/preview"],
  });

  const filteredStories = allStories.filter((story) => {
    if (selectedLanguage && story.language !== selectedLanguage) return false;
    if (selectedCategory && story.category !== selectedCategory) return false;
    if (selectedType && story.storyType !== selectedType) return false;
    return true;
  });

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentStep("category");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentStep("type");
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setCurrentStep("stories");
  };

  const handleBack = () => {
    if (currentStep === "category") {
      setCurrentStep("language");
      setSelectedLanguage("");
    } else if (currentStep === "type") {
      setCurrentStep("category");
      setSelectedCategory("");
    } else if (currentStep === "stories") {
      setCurrentStep("type");
      setSelectedType("");
    } else {
      setLocation("/");
    }
  };

  const handleStoryClick = (storyId: string) => {
    setLocation(`/child-mode?storyId=${storyId}`);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case "language":
        return <Languages className="w-6 h-6" />;
      case "category":
        return <BookMarked className="w-6 h-6" />;
      case "type":
        return <Layers className="w-6 h-6" />;
      case "stories":
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "language":
        return "Choose Your Language";
      case "category":
        return "Pick a Category";
      case "type":
        return "Choose Story Type";
      case "stories":
        return "Your Stories";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                {getStepIcon()}
                <h1 className="text-xl font-bold">{getStepTitle()}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            {currentStep === "language" && (
              <motion.div
                key="language"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
              >
                {languages.map((lang) => {
                  const IconComponent = lang.icon;
                  return (
                    <Card
                      key={lang.value}
                      className="p-8 cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleLanguageSelect(lang.value)}
                      data-testid={`card-language-${lang.value}`}
                    >
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold">{lang.label}</h3>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {currentStep === "category" && (
              <motion.div
                key="category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
              >
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <Card
                      key={cat.value}
                      className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleCategorySelect(cat.value)}
                      data-testid={`card-category-${cat.value}`}
                    >
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">{cat.label}</h3>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {currentStep === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
              >
                {storyTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleTypeSelect(type.value)}
                      data-testid={`card-type-${type.value}`}
                    >
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">{type.label}</h3>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {currentStep === "stories" && (
              <motion.div
                key="stories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {selectedLanguage && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {languages.find(l => l.value === selectedLanguage)?.label}
                    </Badge>
                  )}
                  {selectedCategory && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {categories.find(c => c.value === selectedCategory)?.label}
                    </Badge>
                  )}
                  {selectedType && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {storyTypes.find(t => t.value === selectedType)?.label}
                    </Badge>
                  )}
                </div>

                {filteredStories.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <BookMarked className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold">No Stories Found</h3>
                      <p className="text-muted-foreground">
                        Try selecting different options or go back to change your filters.
                      </p>
                      <Button onClick={handleBack} variant="outline" data-testid="button-change-filters">
                        Change Filters
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStories.map((story) => (
                      <Card
                        key={story.id}
                        className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all"
                        onClick={() => handleStoryClick(story.id)}
                        data-testid={`card-story-${story.id}`}
                      >
                        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                          {story.imageUrl && (
                            <img
                              src={story.imageUrl}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold line-clamp-2">{story.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {story.summary}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.value === story.category)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {storyTypes.find(t => t.value === story.storyType)?.label}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
