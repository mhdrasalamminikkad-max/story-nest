import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@shared/schema";
import { Trophy, Star, BookOpen, Brain, Palette } from "lucide-react";
import { motion } from "framer-motion";

const GAME_ICONS = {
  quiz: Brain,
  wordMatching: BookOpen,
  memory: Star,
  drawing: Palette,
};

export function BadgesDisplay() {
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  if (badges.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No badges earned yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete story games to earn badges!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold">My Badges ({badges.length})</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((badge, index) => {
          const IconComponent = GAME_ICONS[badge.gameType as keyof typeof GAME_ICONS] || Trophy;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="p-4 text-center hover-elevate" 
                data-testid={`badge-${badge.id}`}
              >
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <p className="text-xs font-medium line-clamp-2">
                  {badge.badgeName}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
