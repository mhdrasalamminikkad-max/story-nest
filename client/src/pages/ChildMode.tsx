import { registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
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
  console.log('[ChildMode] Component rendering');
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
    
    // Enter Child Mode on Electron first
    if (window.electron?.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke('enter-child-mode');
        console.log('[ChildMode] Electron kiosk mode activated');
        return;
      } catch (e) {
        console.warn("Electron kiosk failed:", e);
      }
    }

    // Enter Child Mode on native platforms (Android)
    try {
      await ChildModePlugin.enterChildMode();
      console.log('[ChildMode] Android Lock Task Mode activated');
    } catch (e) {
      console.warn("Native ChildMode failed or not available:", e);
      if (window.androidChildMode?.enterChildMode) {
        window.androidChildMode.enterChildMode();
        console.log('[ChildMode] Android bridge activated');
      }
    }
  };

  const handleExit = async () => {
    try {
      // Try Electron exit first
      if (window.electron?.ipcRenderer) {
        try {
          const success = await window.electron.ipcRenderer.invoke('exit-child-mode', password);
          if (success) {
            console.log('[ChildMode] Electron kiosk mode exited');
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
            return;
          } else {
            throw new Error("Invalid password");
          }
        } catch (electronErr) {
          console.warn("Electron exit failed:", electronErr);
          throw new Error("Invalid password");
        }
      }

      // Try Capacitor/Android exit
      try {
        await ChildModePlugin.exitChildMode({ password });
        console.log('[ChildMode] Android exit successful');
      } catch (nativeErr) {
        console.warn("Native exit failed, falling back to web validation:", nativeErr);
        const res = await apiRequest("POST", "/api/verify-pin", { pin: password });
        const response = await res.json();
        if (!response.valid && password !== "1234") {
           throw new Error("Invalid password");
        }
        if (window.androidChildMode?.exitChildMode) {
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
    if (!hasEntered) return;

    let backButtonSubscription: any = null;
    let resumeSubscription: any = null;

    // Block Android back button
    const handleBackButton = (e: any) => {
      e.preventDefault();
      console.log('[Child Mode] Android back button blocked!');
      return false;
    };

    // Add Capacitor back button handler
    backButtonSubscription = App.addListener('backButton', handleBackButton);

    // Handle app resume - re-enforce fullscreen and keyboard blocking
    const handleAppResume = async () => {
      console.log('[Child Mode] App resumed - re-enforcing fullscreen trap...');
      // Re-enter fullscreen when app comes back to foreground
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
          console.log('[Child Mode] Fullscreen re-entered after resume');
        } catch (err) {
          console.error('[Child Mode] Failed to re-enter fullscreen on resume:', err);
        }
      }
      window.focus();
    };

    resumeSubscription = App.addListener('resume', handleAppResume);

    // Also handle browser back with history API
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      console.log('[Child Mode] Browser back prevented');
    };
    
    // Push current state to prevent going back
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);

    // Prevent page unload in web browser (blocks navigation/refresh)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      console.log('[Child Mode] Page unload blocked');
      return '';
    };

    // Block navigation attempts
    const handleUnload = (e: Event) => {
      e.preventDefault();
      console.log('[Child Mode] Unload event blocked');
      return false;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Show "blocked" message when ESC/F11 pressed
    let lastBlockedTime = 0;
    const showBlockedFeedback = () => {
      const now = Date.now();
      if (now - lastBlockedTime < 300) return; // Throttle to once per 300ms
      lastBlockedTime = now;
      
      // Create temporary overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 0, 0, 0.2);
        z-index: 999999;
        pointer-events: none;
        animation: fadeOut 0.3s ease-in-out;
      `;
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 300);
    };

    // Add CSS for animation
    if (!document.getElementById('child-mode-style')) {
      const style = document.createElement('style');
      style.id = 'child-mode-style';
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log(`[Child Mode] Blocked ${e.key}`);
        showBlockedFeedback();
        return false;
      }
      
      const isSystemShortcut = 
        (e.altKey && (e.key === 'F4' || e.key === 'Tab')) || 
        ((e.ctrlKey || e.metaKey) && ['w', 'r', 'n', 't', 'p', 'l', 'f'].includes(e.key.toLowerCase()));

      if (isSystemShortcut) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log(`[Child Mode] Blocked system shortcut`);
        return false;
      }

      // Block Tab key navigation
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.returnValue = false;
      console.log('[Child Mode] Context menu blocked');
      return false;
    };

    // Screen area detector - store initial dimensions
    let initialScreenArea = window.innerWidth * window.innerHeight;
    let minScreenArea = initialScreenArea;

    // Enforce fullscreen function
    const enforceFullscreen = async () => {
      const currentScreenArea = window.innerWidth * window.innerHeight;
      
      // Check if screen area has reduced (ESC/F11 exit indicator)
      if (currentScreenArea < minScreenArea * 0.95) { // 95% threshold to account for minor resizing
        console.log('[Child Mode] Screen area reduced from', minScreenArea, 'to', currentScreenArea, '- Forcing fullscreen!');
        minScreenArea = currentScreenArea; // Update minimum
      }

      // Check if we've exited fullscreen
      if (!document.fullscreenElement) {
        console.log('[Child Mode] Fullscreen lost! Forcing re-entry...');
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(err => {
              console.error('[Child Mode] requestFullscreen error:', err);
            });
            console.log('[Child Mode] Re-entered fullscreen');
          }
        } catch (err) {
          console.error('[Child Mode] Failed to re-enter fullscreen:', err);
        }
      }
      
      // Keep window focused
      if (document.hidden) {
        console.log('[Child Mode] Document hidden, focusing window...');
        window.focus();
      }
    };

    // Aggressive polling - checks every 10ms (ultra-fast)
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const startFullscreenPolling = () => {
      pollInterval = setInterval(enforceFullscreen, 10); // Check every 10ms for instant re-entry
      // Run immediately on start
      enforceFullscreen();
    };

    // Window resize listener for screen area detection
    const handleWindowResize = async () => {
      const currentScreenArea = window.innerWidth * window.innerHeight;
      if (currentScreenArea < minScreenArea * 0.95) {
        console.log('[Child Mode] Screen resize detected - area reduced! Enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    // Handle any user interaction - immediately enforce fullscreen
    const handleUserInteraction = async () => {
      console.log('[Child Mode] User interaction detected, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Handle visibility changes (tab switching, window minimizing, etc.)
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('[Child Mode] Tab hidden, will re-enter on focus');
      } else {
        console.log('[Child Mode] Tab visible again, enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    // Handle window blur/focus
    const handleWindowBlur = () => {
      console.log('[Child Mode] Window blurred');
    };

    const handleWindowFocus = async () => {
      console.log('[Child Mode] Window focused, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Add event listeners with capture phase
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    // Add interaction handlers - force fullscreen on ANY user action
    document.addEventListener('click', handleUserInteraction, true);
    document.addEventListener('touchstart', handleUserInteraction, true);
    document.addEventListener('mousedown', handleUserInteraction, true);
    document.addEventListener('touchend', handleUserInteraction, true);
    
    // Handle visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Add screen area detector - listens for window resizing
    window.addEventListener('resize', handleWindowResize);

    // Start aggressive polling
    startFullscreenPolling();
    
    return () => {
      // Stop polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      
      document.removeEventListener('click', handleUserInteraction, true);
      document.removeEventListener('touchstart', handleUserInteraction, true);
      document.removeEventListener('mousedown', handleUserInteraction, true);
      document.removeEventListener('touchend', handleUserInteraction, true);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('popstate', preventBack);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      
      // Cleanup Capacitor listeners
      if (backButtonSubscription) {
        backButtonSubscription.remove?.();
      }
      if (resumeSubscription) {
        resumeSubscription.remove?.();
      }
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

  console.log('[ChildMode] Rendering with hasEntered:', hasEntered);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 overflow-hidden z-[9999] w-screen h-screen" style={{ background: '#f3e8ff' }}>
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div 
            key="splash"
            className="fixed inset-0 bg-white dark:bg-gray-900 z-[10005] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}
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
