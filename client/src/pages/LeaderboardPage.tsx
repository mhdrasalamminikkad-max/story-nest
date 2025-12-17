import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  childName: string | null;
  userId: string;
  badgeCount?: number;
  storyCount?: number;
}

const RANK_COLORS = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

const RANK_ICONS = {
  1: Trophy,
  2: Medal,
  3: Star,
};

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  
  const { data: childrenLeaderboard = [], isLoading: loadingChildren } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/children"],
  });

  const { data: parentsLeaderboard = [], isLoading: loadingParents } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/parents"],
  });

  const renderLeaderboard = (
    entries: LeaderboardEntry[],
    scoreKey: "badgeCount" | "storyCount",
    scoreLabel: string,
    loading: boolean,
    isParentLeaderboard = false
  ) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-[#febc2d]" />
            <p className="text-black dark:text-black">No rankings yet</p>
            <p className="text-sm text-black dark:text-black mt-1">
              Be the first to earn {scoreLabel}!
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const RankIcon = RANK_ICONS[rank as keyof typeof RANK_ICONS] || null;
          const rankColor = RANK_COLORS[rank as keyof typeof RANK_COLORS] || "text-muted-foreground";
          const score = entry[scoreKey] || 0;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="hover-elevate" 
                data-testid={`leaderboard-rank-${rank}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {RankIcon ? (
                        <RankIcon className={`w-8 h-8 ${rankColor}`} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="font-bold text-sm">{rank}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-lg">
                        {isParentLeaderboard 
                          ? `Parent of ${entry.childName || "Anonymous"}` 
                          : entry.childName || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {score} {scoreLabel}
                      </p>
                    </div>

                    {rank <= 3 && (
                      <div className={`px-3 py-1 rounded-full ${
                        rank === 1 ? "bg-yellow-100 dark:bg-yellow-900/20" :
                        rank === 2 ? "bg-gray-100 dark:bg-gray-800/20" :
                        "bg-amber-100 dark:bg-amber-900/20"
                      }`}>
                        <span className={`text-sm font-bold ${rankColor}`}>
                          #{rank}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground">
            Celebrating our top achievers
          </p>
        </div>

        <Tabs defaultValue="children" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="children" data-testid="tab-children">
              Top Children
            </TabsTrigger>
            <TabsTrigger value="parents" data-testid="tab-parents">
              Top Parents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top 10 Children by Badges Earned
                </CardTitle>
                <CardDescription>
                  Children who have earned the most game badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(childrenLeaderboard, "badgeCount", "badges", loadingChildren)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parents" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  Top 10 Parents by Stories Published
                </CardTitle>
                <CardDescription>
                  Parents who have created the most published stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(parentsLeaderboard, "storyCount", "stories", loadingParents, true)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
