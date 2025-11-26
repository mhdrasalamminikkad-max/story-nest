import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Star, Sparkles } from "lucide-react";

export function AnimatedBackground() {
  const { theme } = useTheme();

  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 2,
  }));

  const clouds = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60 + 10,
    scale: Math.random() * 0.5 + 0.7,
    duration: Math.random() * 40 + 50,
  }));

  const floatingElements = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    duration: Math.random() * 6 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Moon */}
      {theme === "night" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 right-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="w-20 h-20 text-yellow-200 drop-shadow-[0_0_30px_rgba(250,250,150,0.5)]" />
          </motion.div>
        </motion.div>
      )}

      {/* Stars - Twinkling with Glow */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 1, 0.3],
            scale: [0.8, 1.3, 0.9],
            boxShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 8px rgba(255,255,255,0.8)",
              "0 0 2px rgba(255,255,255,0)"
            ],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
        >
          <Star
            className="text-[#FEF735]"
            style={{ width: `${star.size * 4}px`, height: `${star.size * 4}px` }}
            fill="currentColor"
          />
        </motion.div>
      ))}

      {/* Floating Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            opacity: [0.3, 0.8, 0.3],
            rotate: [0, 360],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles
            className={theme === "night" ? "text-purple-300" : "text-primary/40"}
            style={{ width: `${element.size}px`, height: `${element.size}px` }}
          />
        </motion.div>
      ))}

      {/* Clouds - Drifting */}
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          className={`absolute ${theme === "night" ? "opacity-15" : "opacity-25"}`}
          style={{
            top: `${cloud.y}%`,
          }}
          initial={{ x: "-10%" }}
          animate={{ x: "110%" }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className={theme === "night" ? "text-indigo-300" : "text-blue-200"}
            style={{ transform: `scale(${cloud.scale})` }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="120" height="60" viewBox="0 0 120 60" fill="currentColor">
              <ellipse cx="30" cy="35" rx="25" ry="20" />
              <ellipse cx="60" cy="25" rx="35" ry="25" />
              <ellipse cx="90" cy="35" rx="25" ry="20" />
            </svg>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
