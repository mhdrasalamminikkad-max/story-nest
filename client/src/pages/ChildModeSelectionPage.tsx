import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { Star, Sparkles, BookOpen, Play, Heart, Music, Wand2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PINDialog } from "@/components/PINDialog";
import { apiRequest } from "@/lib/queryClient";

export default function ChildModeSelectionPage() {
  const [, setLocation] = useLocation();
  const [showPINDialog, setShowPINDialog] = useState(false);

  // Check if a story was pre-selected from parent dashboard
  const searchParams = new URLSearchParams(window.location.search);
  const preSelectedStoryId = searchParams.get("story");

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  // Block keyboard shortcuts in child mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block ESC, F11, F12, F5
      const blockedKeys = ['Escape', 'F5', 'F11', 'F12'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        console.log(`[Child Mode Selection] Blocked ${e.key}`);
        return false;
      }

      // Block system shortcuts
      if (e.altKey && (e.key === 'F4' || e.key === 'Tab')) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && ['w', 'r', 'q', 'n', 't', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        e.returnValue = false;
        return false;
      }

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
      return false;
    };

    // Enforce fullscreen function
    const enforceFullscreen = async () => {
      // Check if we've exited fullscreen
      if (!document.fullscreenElement) {
        console.log('[Child Mode Selection] Fullscreen lost! Forcing re-entry...');
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(err => {
              console.error('[Child Mode Selection] requestFullscreen error:', err);
            });
            console.log('[Child Mode Selection] Re-entered fullscreen');
          }
        } catch (err) {
          console.error('[Child Mode Selection] Failed to re-enter fullscreen:', err);
        }
      }
      
      // Keep window focused
      if (document.hidden) {
        console.log('[Child Mode Selection] Document hidden, focusing window...');
        window.focus();
      }
    };

    // Screen area detector - store initial dimensions
    let initialScreenArea = window.innerWidth * window.innerHeight;
    let minScreenArea = initialScreenArea;

    // Aggressive polling - checks every 50ms
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const startFullscreenPolling = () => {
      pollInterval = setInterval(() => {
        const currentScreenArea = window.innerWidth * window.innerHeight;
        
        // Check if screen area has reduced (ESC/F11 exit indicator)
        if (currentScreenArea < minScreenArea * 0.95) { // 95% threshold
          console.log('[Child Mode Selection] Screen area reduced from', minScreenArea, 'to', currentScreenArea, '- Forcing fullscreen!');
          minScreenArea = currentScreenArea;
        }
        
        enforceFullscreen();
      }, 50); // Check every 50ms
      // Run immediately on start
      enforceFullscreen();
    };

    // Handle any user interaction - immediately enforce fullscreen
    const handleUserInteraction = async () => {
      console.log('[Child Mode Selection] User interaction detected, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Handle visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('[Child Mode Selection] Tab hidden');
      } else {
        console.log('[Child Mode Selection] Tab visible, enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    // Handle window focus
    const handleWindowFocus = async () => {
      console.log('[Child Mode Selection] Window focused, enforcing fullscreen...');
      await enforceFullscreen();
    };

    // Window resize listener for screen area detection
    const handleWindowResize = async () => {
      const currentScreenArea = window.innerWidth * window.innerHeight;
      if (currentScreenArea < minScreenArea * 0.95) {
        console.log('[Child Mode Selection] Screen resize detected - area reduced! Enforcing fullscreen...');
        await enforceFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    // Add interaction handlers
    document.addEventListener('click', handleUserInteraction, true);
    document.addEventListener('touchstart', handleUserInteraction, true);
    document.addEventListener('mousedown', handleUserInteraction, true);
    document.addEventListener('touchend', handleUserInteraction, true);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // Add screen area detector - listens for window resizing
    window.addEventListener('resize', handleWindowResize);

    // Start aggressive polling
    startFullscreenPolling();

    return () => {
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
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Auto-navigate to story if pre-selected AND it's a child/both story
  useEffect(() => {
    if (preSelectedStoryId && stories.length > 0) {
      const story = stories.find(s => s.id === preSelectedStoryId);
      // Only auto-navigate if story exists and is intended for children
      if (story && (story.audience === "child" || story.audience === "both")) {
        setLocation(`/child-mode-read?story=${story.id}`);
      }
    }
  }, [preSelectedStoryId, stories, setLocation]);

  const handleVerifyPIN = async (pin: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/verify-pin", { pin });
      const response = await res.json();
      if (response.valid) {
        setLocation("/dashboard");
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleStoryClick = (story: Story) => {
    setLocation(`/child?story=${story.id}`);
  };

  const categoryColors: Record<string, string> = {
    "fairy-tale": "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-300/50 dark:border-pink-600/50",
    "adventure": "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300/50 dark:border-orange-600/50",
    "educational": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-600/50",
    "moral": "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300/50 dark:border-green-600/50",
    "history": "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300/50 dark:border-purple-600/50",
    "islamic": "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-600/50",
  };

  const floatingElements = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 5 + Math.random() * 6,
    size: Math.random() * 12 + 3,
    type: ['star', 'heart', 'sparkles', 'music', 'circle', 'wand'][i % 6],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900 relative overflow-hidden">
      {/* MEGA ANIMATED BACKGROUND ORBS */}
      <motion.div className="fixed inset-0 pointer-events-none">
        {/* Massive outer orbs */}
        <motion.div 
          className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-transparent rounded-full blur-3xl filter"
          animate={{ x: [0, 100, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/40 via-cyan-600/40 to-transparent rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.4, 1], rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-600/35 to-purple-600/35 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </motion.div>

      {/* MEGA ANIMATED FLOATING ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((elem) => (
          <motion.div
            key={elem.id}
            className="absolute"
            style={{
              left: `${elem.x}%`,
              top: `${elem.y}%`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() > 0.5 ? 40 : -40, 0],
              rotate: [0, 360],
              scale: [0.6, 1.5, 0.6],
              opacity: [0.1, 1, 0.1],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "easeInOut",
            }}
          >
            {elem.type === 'star' && (
              <motion.div animate={{ filter: [`drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))`, `drop-shadow(0 0 12px rgba(253, 224, 71, 0.8))`, `drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))`] }} transition={{ duration: 2, repeat: Infinity }}>
                <Star className="text-yellow-400 dark:text-yellow-300" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
              </motion.div>
            )}
            {elem.type === 'heart' && (
              <motion.div animate={{ filter: [`drop-shadow(0 0 4px rgba(236, 72, 153, 0.4))`, `drop-shadow(0 0 12px rgba(236, 72, 153, 0.8))`, `drop-shadow(0 0 4px rgba(236, 72, 153, 0.4))`] }} transition={{ duration: 2, repeat: Infinity }}>
                <Heart className="text-pink-500 dark:text-pink-400" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
              </motion.div>
            )}
            {elem.type === 'sparkles' && (
              <Sparkles className="text-purple-500 dark:text-purple-400" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} />
            )}
            {elem.type === 'music' && (
              <Music className="text-blue-500 dark:text-blue-400" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} />
            )}
            {elem.type === 'circle' && (
              <motion.div animate={{ filter: [`drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))`, `drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))`, `drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))`] }} transition={{ duration: 2, repeat: Infinity }}>
                <Circle className="text-purple-500 dark:text-purple-400" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} fill="currentColor" />
              </motion.div>
            )}
            {elem.type === 'wand' && (
              <Wand2 className="text-indigo-500 dark:text-indigo-400" style={{ width: `${elem.size}px`, height: `${elem.size}px` }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* SUPER ANIMATED EXIT BUTTON */}
      <div className="fixed top-6 right-6 z-50">
        <motion.button
          onClick={() => setShowPINDialog(true)}
          className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white px-7 py-3 rounded-full shadow-2xl font-bold text-lg flex items-center gap-3 border-3 border-white/50 overflow-hidden"
          whileHover={{ boxShadow: "0 30px 60px rgba(239, 68, 68, 0.8)" }}
          whileTap={{ scale: 0.92 }}
          data-testid="button-exit-child-mode"
        >
          {/* Glowing background effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-300/50 to-red-400/0"
            animate={{ x: [-100, 100] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.span 
            animate={{ rotate: [0, 25, 0], y: [0, -5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-2xl relative z-10"
          >
            👋
          </motion.span>
          <span className="relative z-10">Exit</span>
        </motion.button>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        {/* MEGA GORGEOUS WELCOME HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, type: "spring", stiffness: 80, damping: 15 }}
          className="text-center mb-16 md:mb-20 relative"
        >
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="w-full h-full bg-gradient-to-b from-purple-400 via-pink-400 to-transparent rounded-full" />
          </motion.div>

          {/* MEGA ANIMATED EMOJI CELEBRATION */}
          <div className="mb-8 flex justify-center gap-4 md:gap-6">
            <motion.span 
              animate={{ rotate: [0, 360], y: [0, -25, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-7xl sm:text-8xl md:text-9xl inline-block"
            >
              ✨
            </motion.span>
            <motion.span 
              animate={{ rotate: [0, -360], scale: [1, 1.3, 1], y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.3 }}
              className="text-7xl sm:text-8xl md:text-9xl inline-block"
            >
              📚
            </motion.span>
            <motion.span 
              animate={{ rotate: [0, 360], y: [0, -25, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.6 }}
              className="text-7xl sm:text-8xl md:text-9xl inline-block"
            >
              ✨
            </motion.span>
          </div>

          {/* MASSIVE BEAUTIFUL PULSING TITLE */}
          <motion.h1 
            className="font-heading text-6xl sm:text-7xl md:text-9xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-300 dark:via-pink-300 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight"
            animate={{ scale: [1, 1.08, 1], y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {settings?.childName ? `Welcome ${settings.childName}!` : "Story Time!"}
          </motion.h1>

          {/* ENHANCED ANIMATED SUBTITLE */}
          <motion.p 
            className="text-2xl sm:text-3xl md:text-5xl text-gray-700 dark:text-gray-300 font-bold drop-shadow-lg"
            animate={{ y: [0, -8, 0], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Choose your magical adventure
          </motion.p>
        </motion.div>

        {/* STORIES GRID - MEGA ULTRA BEAUTIFUL */}
        {stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <motion.div 
              animate={{ scale: [1, 1.3, 1], rotate: [0, 360], filter: [`drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))`, `drop-shadow(0 0 20px rgba(249, 115, 22, 0.8))`, `drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))`] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-9xl mb-8 inline-block"
            >
              📖
            </motion.div>
            <p className="text-4xl text-gray-600 dark:text-gray-400 font-bold">
              No stories available yet. Check back soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 60, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 150, damping: 20 }}
                whileHover={{ y: -25 }}
                data-testid={`card-story-${index}`}
                className="relative group"
              >
                {/* GLOWING CARD BACKGROUND EFFECT */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-2xl"
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.1 }}
                />

                <Card
                  className="overflow-hidden cursor-pointer hover-elevate transition-all border-4 border-white/40 h-full shadow-2xl hover:shadow-3xl rounded-3xl relative z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm"
                  onClick={() => handleStoryClick(story)}
                >
                  {/* STORY IMAGE WITH MULTIPLE OVERLAYS */}
                  <div className="relative h-60 md:h-72 overflow-hidden bg-gradient-to-br from-purple-300 to-pink-300 dark:from-purple-800 dark:to-pink-800 group">
                    {/* Animated rotating gradient background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-transparent via-white/15 to-transparent"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Rainbow shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-rainbow/20 to-transparent"
                      animate={{ x: [-200, 200] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    <motion.img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover relative z-10"
                      loading="lazy"
                      data-testid={`img-story-${index}`}
                      whileHover={{ rotate: 2 }}
                      transition={{ duration: 0.4 }}
                    />

                    {/* Multi-layer glow overlay on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-primary/50 via-secondary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 z-30">
                      <motion.div whileTap={{ scale: 0.85 }}>
                        <Badge className={`${categoryColors[story.category] || "bg-gray-500/20"} font-bold text-sm border-2 backdrop-blur-md shadow-lg`}>
                          {story.category}
                        </Badge>
                      </motion.div>
                    </div>

                    {/* Audio Indicator with mega glow */}
                    {story.voiceoverUrl && (
                      <motion.div 
                        className="absolute bottom-3 right-3 bg-gradient-to-br from-primary via-secondary to-accent p-4 rounded-full shadow-2xl z-30 border-3 border-white/60"
                        animate={{ scale: [1, 1.25, 1], filter: [`drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))`, `drop-shadow(0 0 20px rgba(99, 102, 241, 1))`, `drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))`] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
                          <Play className="w-7 h-7 text-white" fill="currentColor" />
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* STORY CONTENT - MEGA ULTRA BEAUTIFUL */}
                  <div className="p-6 md:p-7 bg-gradient-to-br from-white/98 via-purple-50/90 to-pink-50/90 dark:from-gray-800/98 dark:via-purple-900/90 dark:to-pink-900/90">
                    {/* Title */}
                    <motion.h3 
                      className="font-heading text-2xl md:text-3xl font-black mb-3 text-gray-900 dark:text-white line-clamp-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {story.title}
                    </motion.h3>

                    {/* Summary */}
                    <motion.p 
                      className="text-sm md:text-base text-gray-700 dark:text-gray-300 line-clamp-3 mb-6 font-medium leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {story.summary}
                    </motion.p>

                    {/* MEGA ULTRA-BEAUTIFUL READ BUTTON */}
                    <motion.div
                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white px-7 py-5 rounded-2xl font-bold text-lg md:text-xl shadow-lg border-3 border-white/50 relative overflow-hidden group cursor-pointer"
                      whileHover={{ boxShadow: "0 30px 60px rgba(139, 92, 246, 0.9)" }}
                      whileTap={{ scale: 0.92 }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                    >
                      {/* Dual shimmer effects */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: [-150, 150] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-transparent"
                        animate={{ x: [150, -150] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 20, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="relative z-10"
                      >
                        <BookOpen className="w-7 h-7" />
                      </motion.div>
                      <span className="relative font-heading z-10">Read Story</span>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* PIN DIALOG */}
      <PINDialog
        open={showPINDialog}
        onOpenChange={setShowPINDialog}
        onVerify={handleVerifyPIN}
        title="Exit Child Mode?"
        description="Ask a parent to enter their PIN"
      />
    </div>
  );
}
