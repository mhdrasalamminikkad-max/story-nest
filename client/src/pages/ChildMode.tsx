declare global {
  interface Window {
    Capacitor?: any;
    androidChildMode?: {
      enterChildMode: () => void;
      exitChildMode: (password: string) => void;
    };
    electronAPI?: {
      enterChildMode: () => void;
      exitChildMode: (password: string) => void;
    };
  }
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, LogOut, BookOpen, Star, Sparkles, Music, Heart, Circle, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function ChildMode() {
  const [password, setPassword] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const handleEnterMagicWorld = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    setHasEntered(true);
    
    // Enter Child Mode on native platforms
    if (window.Capacitor || window.androidChildMode) {
      if (window.androidChildMode) {
        window.androidChildMode.enterChildMode();
      }
    }
    if (window.electronAPI) {
      window.electronAPI.enterChildMode();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // List of keys to strictly block
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Blocked key: ${e.key}`);
      }
      
      // Disable system shortcuts (Alt+F4, Ctrl+W, Ctrl+R, etc.)
      const isSystemShortcut = 
        (e.altKey && (e.key === 'F4' || e.key === 'Tab')) || 
        ((e.ctrlKey || e.metaKey) && ['w', 'r', 'n', 't', 'p', 'l', 'f'].includes(e.key.toLowerCase()));

      if (isSystemShortcut) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Blocked system shortcut: ${e.key}`);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasEntered && !isExiting) {
        e.preventDefault();
        // Standard way to trigger a confirmation dialog
        e.returnValue = 'Magic world is still open! Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleFullscreenChange = () => {
      if (hasEntered && !document.fullscreenElement && !isExiting) {
        console.log("Detecting exit from fullscreen, attempting re-entry...");
        const element = document.documentElement;
        element.requestFullscreen().catch(() => {
          console.warn("Fullscreen re-entry denied by browser policy");
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (hasEntered && !isExiting) {
        e.preventDefault();
      }
    };

    // Use capture phase (true) to intercept events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [hasEntered, isExiting]);

  const handleExit = async () => {
    console.log("Checking password:", password);
    
    try {
      const res = await apiRequest("POST", "/api/verify-pin", { pin: password });
      const response = await res.json();
      
      if (response.valid) {
        console.log("Password correct, exiting...");
        if (window.androidChildMode) {
          window.androidChildMode.exitChildMode(password);
        }
        if (window.electronAPI) {
          window.electronAPI.exitChildMode(password);
        }
        toast({
          title: "Exiting Child Mode",
          description: "Returning to normal operation.",
        });
        
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.warn(`Error attempting to exit full-screen mode: ${err.message}`);
          });
        }

        setLocation("/dashboard");
      } else {
        console.log("Password incorrect!");
        toast({
          variant: "destructive",
          title: "Invalid Password",
          description: "Please enter the correct parent password.",
        });
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      // Fallback to hardcoded for safety if API fails
      if (password === "1234") {
        setLocation("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify password. Please try again.",
        });
      }
    }
  };

  const categoryColors: Record<string, string> = {
    "fairy-tale": "bg-pink-500/20 text-pink-700 border-pink-300/50",
    "adventure": "bg-orange-500/20 text-orange-700 border-orange-300/50",
    "educational": "bg-blue-500/20 text-blue-700 border-blue-300/50",
    "moral": "bg-green-500/20 text-green-700 border-green-300/50",
    "islamic": "bg-teal-500/20 text-teal-700 border-teal-300/50",
  };

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20 + 10,
    type: ['star', 'heart', 'sparkles', 'music'][i % 4],
  }));

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 overflow-hidden z-[9999]">
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div 
            key="splash"
            className="fixed inset-0 bg-white dark:bg-gray-900 z-[10005] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-8 max-w-lg w-full">
              <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-9xl mb-4"
              >
                ✨
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black font-heading text-purple-600 drop-shadow-lg">
                Enter Magic World
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                Your magical adventure is ready! Click below to start in full screen.
              </p>
              <Button 
                size="lg" 
                className="w-full h-24 text-3xl font-black rounded-[2rem] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-[0_20px_50px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all"
                onClick={handleEnterMagicWorld}
                data-testid="button-start-magic"
              >
                Start Magic ✨
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
              {floatingElements.map((elem) => (
                <motion.div
                  key={elem.id}
                  className="absolute opacity-20"
                  style={{ left: `${elem.x}%`, top: `${elem.y}%` }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {elem.type === 'star' && <Star size={elem.size} fill="currentColor" className="text-yellow-400" />}
                  {elem.type === 'heart' && <Heart size={elem.size} fill="currentColor" className="text-pink-400" />}
                  {elem.type === 'sparkles' && <Sparkles size={elem.size} className="text-purple-400" />}
                  {elem.type === 'music' && <Music size={elem.size} className="text-blue-400" />}
                </motion.div>
              ))}
            </div>

            <div className="relative h-full flex flex-col p-4 md:p-8 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <motion.h1 
                  className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-heading"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {settings?.childName ? `Hello, ${settings.childName}!` : "Magic Stories!"}
                </motion.h1>
                
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 py-2 border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  onClick={() => setIsExiting(true)}
                  data-testid="button-exit-child-mode"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Exit Mode
                </Button>
              </div>

              {/* Stories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 pb-20">
                {stories.map((story, idx) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedStory(story)}
                  >
                    <Card className="h-full overflow-hidden border-4 border-white/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                      <div className="h-48 overflow-hidden relative">
                        <img src={story.imageUrl} className="w-full h-full object-cover" alt={story.title} />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${categoryColors[story.category] || "bg-gray-500/20"} border-2 font-bold`}>
                            {story.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-xl font-bold mb-2 font-heading line-clamp-1">{story.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{story.summary}</p>
                        <Button className="w-full rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Dialog */}
      <AnimatePresence>
        {isExiting && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10010]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <Card className="w-full max-w-sm rounded-3xl border-4 border-purple-200 shadow-2xl overflow-hidden">
                <CardHeader className="bg-purple-50 text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <Lock className="text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-heading">Parent Only!</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-center text-muted-foreground font-medium">
                    Please enter the secret code to exit Child Mode.
                  </p>
                  <Input
                    type="password"
                    placeholder="Enter Code"
                    className="h-12 text-center text-lg rounded-2xl border-2 focus:ring-purple-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => {
                      setIsExiting(false);
                      setPassword("");
                    }}>Cancel</Button>
                    <Button className="flex-1 rounded-xl bg-purple-600" onClick={() => {
                      console.log("Checking password:", password);
                      handleExit();
                    }}>Confirm</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Reader Overlap */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            className="fixed inset-0 bg-white dark:bg-gray-900 z-[10020] overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <Button 
                variant="ghost" 
                className="mb-6 rounded-full"
                onClick={() => setSelectedStory(null)}
              >
                ← Back to Stories
              </Button>
              <h2 className="text-4xl md:text-5xl font-black mb-6 font-heading text-purple-600">{selectedStory.title}</h2>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-8 shadow-2xl border-8 border-purple-100">
                <img src={selectedStory.imageUrl} className="w-full h-full object-cover" alt={selectedStory.title} />
              </div>
              <div className="prose prose-purple max-w-none text-lg leading-relaxed dark:prose-invert">
                <p className="text-2xl font-medium mb-4">{selectedStory.summary}</p>
                <div className="whitespace-pre-wrap p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 italic">
                  Interactive reading experience would load the PDF content here...
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


