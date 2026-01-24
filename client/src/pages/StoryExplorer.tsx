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
  Microscope,
  Crown,
  Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@shared/schema";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Badge } from "@/components/ui/badge";

type StepType = "language" | "category" | "stories";

const languages = [
  { value: "english", label: "English", icon: Globe },
  { value: "malayalam", label: "Malayalam", icon: Flag },
];

const categoryOptions = [
  { value: "moral", label: "Moral Stories", icon: Lightbulb },
  { value: "fairy-tale", label: "Folk Tales", icon: Wand2 },
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

  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories/preview"],
  });

  const { data: apiCategories = [] } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: apiStoryTypes = [] } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ["/api/story-types"],
    staleTime: 5 * 60 * 1000,
  });

  const categories = apiCategories.length > 0 
    ? apiCategories.map(c => {
        const fallback = [
          { value: "moral", icon: Lightbulb },
          { value: "fairy-tale", icon: Wand2 },
        ].find(f => f.value === c.slug);
        return { value: c.slug, label: c.name, icon: fallback?.icon || Star };
      })
    : [
        { value: "moral", label: "Moral Stories", icon: Lightbulb },
        { value: "fairy-tale", label: "Folk Tales", icon: Wand2 },
      ];

  const storyTypes = apiStoryTypes.length > 0
    ? apiStoryTypes.map(t => {
        const fallback = [
          { value: "islamic", icon: Star },
          { value: "lesson", icon: BookText },
          { value: "history", icon: Castle },
          { value: "fairy-tale", icon: Sparkles },
          { value: "adventure", icon: Compass },
          { value: "educational", icon: GraduationCap },
          { value: "moral", icon: Heart },
          { value: "mythology", icon: Zap },
          { value: "science", icon: Microscope },
        ].find(f => f.value === t.slug);
        return { value: t.slug, label: t.name, icon: fallback?.icon || Star };
      })
    : [
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

  const filteredStories = allStories.filter((story) => {
    if (selectedLanguage && story.language !== selectedLanguage) return false;
    if (selectedCategory && story.category !== selectedCategory) return false;
    return true;
  });

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentStep("category");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentStep("stories");
  };

  const handleBack = () => {
    if (currentStep === "category") {
      setCurrentStep("language");
      setSelectedLanguage("");
    } else if (currentStep === "stories") {
      setCurrentStep("category");
      setSelectedCategory("");
    } else {
      setLocation("/");
    }
  };

  const handleStoryClick = (storyId: string) => {
    setLocation(`/read-story?story=${storyId}`);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case "language":
        return <Languages className="w-6 h-6" />;
      case "category":
        return <BookMarked className="w-6 h-6" />;
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
      case "stories":
        return "Stories";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-100/30 to-background dark:from-background dark:via-purple-950/30 dark:to-background overflow-hidden">
      <AnimatedBackground />

      {/* Floating Stars Background */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-gradient-to-r from-background/90 to-background/80 dark:from-background/90 dark:to-background/80 backdrop-blur-xl border-b border-primary/10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl hover:bg-primary/20 transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                {getStepIcon()}
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E5683A] to-[#F5C518] bg-clip-text text-transparent">{getStepTitle()}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <AnimatePresence mode="wait">
            {currentStep === "language" && (
              <motion.div
                key="language"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <motion.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#E5683A] mb-3">Choose Your Language</h2>
                  <p className="text-white/70 text-lg">Select a language to explore stories</p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {languages.map((lang, idx) => {
                  const IconComponent = lang.icon;
                  return (
                    <motion.div
                      key={lang.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        className="p-8 cursor-pointer overflow-hidden border-2 border-gradient-to-br from-[#E5683A]/30 to-[#F5C518]/30 hover:from-[#E5683A]/50 hover:to-[#F5C518]/50 transition-all shadow-xl hover:shadow-2xl bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/0 backdrop-blur-sm"
                        onClick={() => handleLanguageSelect(lang.value)}
                        data-testid={`card-language-${lang.value}`}
                      >
                        <div className="relative text-center space-y-4">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-[#F5C518] to-[#E5683A] rounded-2xl flex items-center justify-center mx-auto shadow-xl relative z-10"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <IconComponent className="w-8 h-8 text-gray-900" />
                          </motion.div>
                          <h3 className="text-xl font-bold text-white relative z-10">{lang.label}</h3>
                          <p className="text-sm text-white/60 relative z-10">
                            Read stories in {lang.label.toLowerCase()}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                </div>
              </motion.div>
            )}

            {currentStep === "category" && (
              <motion.div
                key="category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <motion.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#E5683A] mb-3">Choose Your Adventure</h2>
                  <p className="text-white/70 text-lg">Select a category to discover magical stories</p>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {categories.map((cat: any, idx: number) => {
                  const IconComponent = cat.icon || Star;
                  return (
                    <motion.div
                      key={cat.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        className="p-6 sm:p-8 cursor-pointer overflow-hidden border-2 border-gradient-to-br from-[#E5683A]/30 to-[#F5C518]/30 hover:from-[#E5683A]/50 hover:to-[#F5C518]/50 transition-all shadow-xl hover:shadow-2xl bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/0 backdrop-blur-sm"
                        onClick={() => handleCategorySelect(cat.value)}
                        data-testid={`card-category-${cat.value}`}
                      >
                        <div className="relative text-center space-y-4">
                          {/* Glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#F5C518]/20 to-[#E5683A]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-[#F5C518] to-[#E5683A] rounded-2xl flex items-center justify-center mx-auto shadow-xl relative z-10"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <IconComponent className="w-8 h-8 text-gray-900" />
                          </motion.div>
                          <h3 className="text-lg sm:text-xl font-bold text-white relative z-10">{cat.label}</h3>
                          <p className="text-xs sm:text-sm text-white/60 relative z-10 leading-relaxed">
                            Explore amazing {cat.label.toLowerCase()} stories
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                </div>
              </motion.div>
            )}

            {currentStep === "stories" && (
              <motion.div
                key="stories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#E5683A] mb-3">
                    {categories.find(c => c.value === selectedCategory)?.label} Stories
                  </h2>
                  <p className="text-white/70 text-lg">{filteredStories.length} magical {categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} tales waiting for you</p>
                </motion.div>

                {filteredStories.length === 0 ? (
                  <Card className="p-12 text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-2 border-[#E5683A]/30">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-[#F5C518]/20 rounded-full flex items-center justify-center mx-auto">
                        <BookMarked className="w-8 h-8 text-[#F5C518]" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">No Stories Found</h3>
                      <p className="text-white text-lg">
                        Try selecting different options or go back to change your filters.
                      </p>
                      <Button onClick={handleBack} className="bg-[#F5C518] text-gray-900 hover:bg-[#febc2d] font-semibold rounded-xl" data-testid="button-change-filters">
                        Go Back
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredStories.map((story, idx) => (
                      <motion.div
                        key={story.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8 }}
                      >
                        <Card
                          className="overflow-hidden cursor-pointer border-2 border-[#E5683A]/20 hover:border-[#E5683A]/50 transition-all shadow-xl hover:shadow-2xl bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/0 backdrop-blur-sm group"
                          onClick={() => handleStoryClick(story.id)}
                          data-testid={`card-story-${story.id}`}
                        >
                          <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#E5683A]/30 to-[#F5C518]/30">
                            {story.imageUrl && (
                              <img
                                src={story.imageUrl}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="text-white font-semibold text-sm"
                              >
                                Click to Read ✨
                              </motion.div>
                            </div>
                          </div>
                          <div className="p-4 sm:p-5 space-y-3">
                            <h3 className="font-bold text-lg sm:text-xl text-white line-clamp-2 group-hover:text-[#F5C518] transition-colors">{story.title}</h3>
                            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                              {story.summary}
                            </p>
                            <div className="flex gap-2 flex-wrap pt-2">
                              <Badge variant="outline" className="text-xs bg-[#F5C518]/20 text-[#F5C518] border-[#F5C518]/30">
                                {categories.find(c => c.value === story.category)?.label}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
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
