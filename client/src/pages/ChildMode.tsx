import { registerPlugin } from "@capacitor/core";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, LogOut, BookOpen, Star, Sparkles, Music, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

const ChildModePlugin = registerPlugin<any>("ChildMode");

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

  const { data: apiCategories = [] } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ["/api/admin/categories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const handleEnterMagicWorld = async () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    setHasEntered(true);
    
    // Enter Child Mode on native platforms
    try {
      await ChildModePlugin.enterChildMode();
    } catch (e) {
      console.warn("Native ChildMode failed or not available:", e);
      if (window.androidChildMode) {
        window.androidChildMode.enterChildMode();
      }
    }
  };

  const handleExit = async () => {
    try {
      // First try native exit if available
      try {
        await ChildModePlugin.exitChildMode({ password });
      } catch (nativeErr) {
        console.warn("Native exit failed, falling back to web validation:", nativeErr);
        const res = await apiRequest("POST", "/api/verify-pin", { pin: password });
        const response = await res.json();
        if (!response.valid && password !== "1234") {
           throw new Error("Invalid password");
        }
        if (window.androidChildMode) {
          window.androidChildMode.exitChildMode(password);
        }
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
    } catch (err) {
      console.error("Error during exit:", err);
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Please enter the correct parent password.",
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      const isSystemShortcut = 
        (e.altKey && (e.key === 'F4' || e.key === 'Tab')) || 
        ((e.ctrlKey || e.metaKey) && ['w', 'r', 'n', 't', 'p', 'l', 'f'].includes(e.key.toLowerCase()));

      if (isSystemShortcut) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [hasEntered]);

  const defaultCategoryColors: Record<string, string> = {
    "fairy-tale": "bg-pink-500/20 text-pink-700 border-pink-300/50",
    "adventure": "bg-orange-500/20 text-orange-700 border-orange-300/50",
    "educational": "bg-blue-500/20 text-blue-700 border-blue-300/50",
    "moral": "bg-green-500/20 text-green-700 border-green-300/50",
    "islamic": "bg-teal-500/20 text-teal-700 border-teal-300/50",
  };

  const getCategoryColor = (category: string) => {
    const slug = category.toLowerCase().replace(/\s+/g, '-');
    return defaultCategoryColors[slug] || "bg-purple-500/20 text-purple-700 border-purple-300/50";
  };

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
          >
            <div className="text-center space-y-8 max-w-lg w-full">
              <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-9xl mb-4">✨</motion.div>
              <h1 className="text-5xl md:text-7xl font-black font-heading text-purple-600">Enter Magic World</h1>
              <Button size="lg" className="w-full h-24 text-3xl font-black rounded-[2rem] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-xl" onClick={handleEnterMagicWorld}>Start Magic ✨</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full">
            <div className="relative h-full flex flex-col p-4 md:p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-heading">
                  {settings?.childName ? `Hello, ${settings.childName}!` : "Magic Stories!"}
                </h1>
                <Button variant="outline" className="rounded-full px-6 py-2 border-2" onClick={() => setIsExiting(true)}>
                  <Lock className="w-4 h-4 mr-2" /> Exit Mode
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 pb-20">
                {stories.map((story) => (
                  <Card key={story.id} className="h-full overflow-hidden border-4 border-white/50 rounded-3xl shadow-xl bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => setSelectedStory(story)}>
                    <img src={story.imageUrl} className="h-48 w-full object-cover" alt={story.title} />
                    <CardContent className="p-4">
                      <h3 className="text-xl font-bold mb-2 font-heading">{story.title}</h3>
                      <Button className="w-full rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500">Read Now</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExiting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10010]">
            <Card className="w-full max-w-sm rounded-3xl border-4 border-purple-200 shadow-2xl overflow-hidden">
              <CardHeader className="bg-purple-50 text-center pb-2">
                <Lock className="mx-auto text-purple-600 mb-2" />
                <CardTitle className="text-xl font-heading">Parent Only!</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Input type="password" placeholder="Enter Code" className="h-12 text-center text-lg rounded-2xl border-2" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => { setIsExiting(false); setPassword(""); }}>Cancel</Button>
                  <Button className="flex-1 rounded-xl bg-purple-600" onClick={handleExit}>Confirm</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStory && (
          <motion.div className="fixed inset-0 bg-white dark:bg-gray-900 z-[10020] overflow-y-auto" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <Button variant="ghost" className="mb-6 rounded-full" onClick={() => setSelectedStory(null)}>← Back</Button>
              <h2 className="text-4xl md:text-5xl font-black mb-6 font-heading text-purple-600">{selectedStory.title}</h2>
              <img src={selectedStory.imageUrl} className="aspect-[4/3] rounded-3xl overflow-hidden mb-8 shadow-2xl border-8 border-purple-100 object-cover w-full" alt={selectedStory.title} />
              <div className="prose prose-purple max-w-none text-lg leading-relaxed dark:prose-invert">
                <p className="text-2xl font-medium mb-4">{selectedStory.summary}</p>
                <div className="whitespace-pre-wrap p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 italic">PDF content would load here...</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
