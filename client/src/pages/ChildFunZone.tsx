import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { BookOpen, Gamepad2, Palette, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Floating decoration component
const FloatingElement = ({ children, delay = 0, duration = 3 }: { children: React.ReactNode; delay?: number; duration?: number }) => (
    <motion.div
        initial={{ y: 0, opacity: 0.6 }}
        animate={{
            y: [-20, 20, -20],
            opacity: [0.6, 1, 0.6],
        }}
        transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
        }}
        className="absolute"
    >
        {children}
    </motion.div>
);

// Bubble component
const Bubble = ({ size, left, top, delay }: { size: number; left: string; top: string; delay: number }) => (
    <motion.div
        className="absolute rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
        style={{
            width: size,
            height: size,
            left,
            top,
        }}
        initial={{ y: 0, opacity: 0.3 }}
        animate={{
            y: [-30, -60, -30],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
        }}
        transition={{
            duration: 4 + delay,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
        }}
    />
);

export default function ChildFunZone() {
    const [, setLocation] = useLocation();
    const [hasEntered, setHasEntered] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [password, setPassword] = useState("");
    const { toast } = useToast();

    const { data: stories = [] } = useQuery<Story[]>({
        queryKey: ["/api/stories"],
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

        // Enter Child Mode on Electron/Android
        if (window.electron?.ipcRenderer) {
            try {
                await window.electron.ipcRenderer.invoke('enter-child-mode');
                console.log('[ChildFunZone] Electron kiosk mode activated');
            } catch (e) {
                console.warn("Electron kiosk failed:", e);
            }
        }
    };

    const handleExit = async () => {
        try {
            if (window.electron?.ipcRenderer) {
                const success = await window.electron.ipcRenderer.invoke('exit-child-mode', password);
                if (success) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(err => console.warn(err));
                    }
                    setLocation("/dashboard");
                    return;
                } else {
                    throw new Error("Invalid password");
                }
            }

            const res = await apiRequest("POST", "/api/verify-pin", { pin: password });
            const response = await res.json();
            if (!response.valid) {
                throw new Error("Invalid password");
            }

            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.warn(err));
            }
            setLocation("/dashboard");
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Oops!",
                description: "Wrong password! Ask a grown-up for help.",
            });
        }
    };

    // Comprehensive security: Fullscreen enforcement + keyboard blocking + history manipulation
    useEffect(() => {
        if (!hasEntered) return;

        console.log('[ChildFunZone] 🔒 Activating security measures...');

        // 1. AGGRESSIVE FULLSCREEN ENFORCEMENT
        const enforceFullscreen = async () => {
            if (!document.fullscreenElement) {
                try {
                    await document.documentElement.requestFullscreen();
                    console.log('[ChildFunZone] ✅ Re-entered fullscreen');
                } catch (err) {
                    console.error('[ChildFunZone] ❌ Failed to re-enter fullscreen:', err);
                }
            }
        };

        // 2. BLOCK ALL KEYBOARD SHORTCUTS
        const handleKeyDown = (e: KeyboardEvent) => {
            const blockedKeys = [
                'Escape', 'F5', 'F11', 'F12', 'F1', 'F2', 'F3', 'F4',
                'F6', 'F7', 'F8', 'F9', 'F10'
            ];

            // Block specific keys
            if (blockedKeys.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Show visual feedback
                const overlay = document.createElement('div');
                overlay.style.cssText = `
          position: fixed;
          inset: 0;
          background: rgba(255, 0, 0, 0.2);
          z-index: 9999;
          pointer-events: none;
        `;
                document.body.appendChild(overlay);
                setTimeout(() => overlay.remove(), 200);

                return false;
            }

            // Block Alt+F4, Ctrl+W, Ctrl+Q, Alt+Tab, Windows key
            if (
                (e.altKey && e.key === 'F4') ||
                (e.ctrlKey && e.key === 'w') ||
                (e.ctrlKey && e.key === 'q') ||
                (e.altKey && e.key === 'Tab') ||
                e.key === 'Meta' ||
                e.key === 'OS'
            ) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };

        // 3. PREVENT CONTEXT MENU (right-click)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // 4. BLOCK BROWSER BACK/FORWARD
        const blockNavigation = (e: PopStateEvent) => {
            e.preventDefault();
            window.history.pushState(null, '', window.location.href);
            enforceFullscreen();
        };

        // 5. PREVENT PAGE UNLOAD
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Child Mode is active. Please use the Exit button with PIN.';
            return 'Child Mode is active. Please use the Exit button with PIN.';
        };

        // 6. MONITOR FULLSCREEN CHANGES
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && hasEntered) {
                console.log('[ChildFunZone] ⚠️ Fullscreen exited, re-entering immediately...');
                enforceFullscreen();
            }
        };

        // 7. DETECT SCREEN AREA CHANGES (user trying to exit fullscreen)
        let lastScreenHeight = window.screen.height;
        let lastScreenWidth = window.screen.width;

        const checkScreenArea = () => {
            const currentHeight = window.innerHeight;
            const currentWidth = window.innerWidth;

            // If screen size changed significantly, user might have exited fullscreen
            if (
                Math.abs(currentHeight - lastScreenHeight) > 100 ||
                Math.abs(currentWidth - lastScreenWidth) > 100
            ) {
                console.log('[ChildFunZone] ⚠️ Screen size changed, enforcing fullscreen...');
                enforceFullscreen();
                lastScreenHeight = window.innerHeight;
                lastScreenWidth = window.innerWidth;
            }
        };

        // 8. PUSH HISTORY STATE TO PREVENT BACK BUTTON
        window.history.pushState(null, '', window.location.href);
        window.history.pushState(null, '', window.location.href);

        // ACTIVATE ALL SECURITY MEASURES
        // Ultra-aggressive polling (every 10ms for instant re-entry)
        const pollInterval = setInterval(enforceFullscreen, 10);
        const screenCheckInterval = setInterval(checkScreenArea, 100);

        // Add all event listeners with capture phase (highest priority)
        document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
        document.addEventListener('keyup', handleKeyDown, { capture: true, passive: false });
        document.addEventListener('keypress', handleKeyDown, { capture: true, passive: false });
        document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        window.addEventListener('popstate', blockNavigation);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleBeforeUnload);

        // Also block on window blur (user switching apps)
        window.addEventListener('blur', enforceFullscreen);
        window.addEventListener('focus', enforceFullscreen);

        // Cleanup
        return () => {
            clearInterval(pollInterval);
            clearInterval(screenCheckInterval);
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
            document.removeEventListener('keyup', handleKeyDown, { capture: true });
            document.removeEventListener('keypress', handleKeyDown, { capture: true });
            document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            window.removeEventListener('popstate', blockNavigation);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleBeforeUnload);
            window.removeEventListener('blur', enforceFullscreen);
            window.removeEventListener('focus', enforceFullscreen);
        };
    }, [hasEntered]);

    if (!hasEntered) {
        return (
            <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200">
                {/* Animated background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Bubbles */}
                    <Bubble size={80} left="10%" top="20%" delay={0} />
                    <Bubble size={60} left="80%" top="15%" delay={0.5} />
                    <Bubble size={100} left="5%" top="70%" delay={1} />
                    <Bubble size={50} left="85%" top="60%" delay={1.5} />
                    <Bubble size={70} left="50%" top="80%" delay={2} />

                    {/* Floating clouds */}
                    <FloatingElement delay={0}>
                        <div className="absolute left-[15%] top-[10%] w-32 h-20 bg-white/60 rounded-full blur-sm" />
                    </FloatingElement>
                    <FloatingElement delay={1}>
                        <div className="absolute right-[10%] top-[25%] w-40 h-24 bg-white/50 rounded-full blur-sm" />
                    </FloatingElement>
                    <FloatingElement delay={0.5}>
                        <div className="absolute left-[70%] top-[60%] w-36 h-22 bg-white/55 rounded-full blur-sm" />
                    </FloatingElement>

                    {/* Floating stars */}
                    <FloatingElement delay={0.3}>
                        <div className="absolute left-[25%] top-[30%] text-4xl">⭐</div>
                    </FloatingElement>
                    <FloatingElement delay={0.8}>
                        <div className="absolute right-[20%] top-[50%] text-3xl">✨</div>
                    </FloatingElement>
                    <FloatingElement delay={1.2}>
                        <div className="absolute left-[60%] top-[15%] text-3xl">⭐</div>
                    </FloatingElement>

                    {/* Floating sun */}
                    <FloatingElement delay={0} duration={4}>
                        <div className="absolute left-[8%] top-[35%] text-6xl">☀️</div>
                    </FloatingElement>

                    {/* Floating balloons */}
                    <FloatingElement delay={0.6} duration={3.5}>
                        <div className="absolute right-[15%] top-[40%] text-5xl">🎈</div>
                    </FloatingElement>
                    <FloatingElement delay={1.4} duration={3.8}>
                        <div className="absolute left-[45%] top-[70%] text-4xl">🎈</div>
                    </FloatingElement>

                    {/* Floating hearts */}
                    <FloatingElement delay={0.9} duration={3.2}>
                        <div className="absolute left-[35%] top-[85%] text-3xl">💗</div>
                    </FloatingElement>
                    <FloatingElement delay={1.6} duration={3.6}>
                        <div className="absolute right-[25%] top-[75%] text-3xl">💜</div>
                    </FloatingElement>
                </div>

                {/* Main content */}
                <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        {/* Title cloud */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="relative mb-12"
                        >
                            <div className="bg-white/90 backdrop-blur-md rounded-[3rem] px-16 py-8 shadow-2xl border-4 border-white/50 inline-block">
                                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-heading">
                                    {settings?.childName ? `${settings.childName}'s` : "KIDS"} FUN ZONE!
                                </h1>
                            </div>
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-8 -right-8 text-6xl"
                            >
                                🎈
                            </motion.div>
                        </motion.div>

                        {/* Enter button */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <Button
                                onClick={handleEnterMagicWorld}
                                size="lg"
                                className="text-4xl md:text-5xl px-16 py-12 rounded-[2.5rem] bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 shadow-2xl font-black text-white border-4 border-white/50 transform hover:scale-105 transition-all duration-300"
                            >
                                <Sparkles className="w-12 h-12 mr-4" />
                                START THE FUN! ✨
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200">
            {/* Background decorations (same as entry screen) */}
            <div className="absolute inset-0 overflow-hidden">
                <Bubble size={80} left="10%" top="20%" delay={0} />
                <Bubble size={60} left="80%" top="15%" delay={0.5} />
                <Bubble size={100} left="5%" top="70%" delay={1} />
                <Bubble size={50} left="85%" top="60%" delay={1.5} />
                <FloatingElement delay={0.3}>
                    <div className="absolute left-[25%] top-[30%] text-4xl">⭐</div>
                </FloatingElement>
                <FloatingElement delay={0.8}>
                    <div className="absolute right-[20%] top-[50%] text-3xl">✨</div>
                </FloatingElement>
                <FloatingElement delay={0} duration={4}>
                    <div className="absolute left-[8%] top-[35%] text-6xl">☀️</div>
                </FloatingElement>
            </div>

            {/* Main content */}
            <div className="relative z-10 h-full overflow-y-auto p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <motion.h1
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 font-heading"
                    >
                        Choose Your Fun! 🎉
                    </motion.h1>
                    <Button
                        onClick={() => setIsExiting(true)}
                        variant="outline"
                        className="rounded-full px-6 py-6 bg-white/80 backdrop-blur-md border-4 border-pink-300 hover:bg-pink-100 text-lg font-bold"
                    >
                        <Lock className="w-6 h-6 mr-2" />
                        Exit
                    </Button>
                </div>

                {/* Activity cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Stories Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="cursor-pointer"
                        onClick={() => setLocation("/stories")}
                    >
                        <Card className="bg-gradient-to-br from-yellow-200 to-yellow-300 border-8 border-white/80 rounded-[3rem] shadow-2xl overflow-hidden h-80">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="text-8xl mb-6">📚</div>
                                <h2 className="text-5xl font-black text-white drop-shadow-lg font-heading">
                                    STORIES
                                </h2>
                                <p className="text-xl font-bold text-white/90 mt-4">
                                    Read magical tales!
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Games Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: 10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        className="cursor-pointer"
                    >
                        <Card className="bg-gradient-to-br from-green-200 to-green-300 border-8 border-white/80 rounded-[3rem] shadow-2xl overflow-hidden h-80">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="text-8xl mb-6">🚀</div>
                                <h2 className="text-5xl font-black text-white drop-shadow-lg font-heading">
                                    GAMES
                                </h2>
                                <p className="text-xl font-bold text-white/90 mt-4">
                                    Play and learn!
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Art & Crafts Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6, type: "spring" }}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="cursor-pointer"
                    >
                        <Card className="bg-gradient-to-br from-blue-200 to-blue-300 border-8 border-white/80 rounded-[3rem] shadow-2xl overflow-hidden h-80">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="text-8xl mb-6">🎨</div>
                                <h2 className="text-5xl font-black text-white drop-shadow-lg font-heading">
                                    ART & CRAFTS
                                </h2>
                                <p className="text-xl font-bold text-white/90 mt-4">
                                    Create and color!
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Exit modal */}
            <AnimatePresence>
                {isExiting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                        >
                            <Card className="w-full max-w-md rounded-[2rem] border-8 border-purple-300 shadow-2xl bg-white">
                                <CardContent className="p-8 space-y-6 text-center">
                                    <div className="text-6xl mb-4">🔒</div>
                                    <h3 className="text-3xl font-black text-purple-600 font-heading">
                                        Parent Password
                                    </h3>
                                    <p className="text-lg text-gray-600 font-bold">
                                        Only grown-ups can exit!
                                    </p>
                                    <Input
                                        type="password"
                                        placeholder="Enter password"
                                        className="h-16 text-center text-2xl rounded-2xl border-4 border-purple-200 focus:border-purple-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-xl h-14 text-lg font-bold border-2"
                                            onClick={() => {
                                                setIsExiting(false);
                                                setPassword("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 rounded-xl h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700"
                                            onClick={handleExit}
                                        >
                                            Exit
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
