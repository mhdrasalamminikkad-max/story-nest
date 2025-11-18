import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Star, Target, Gift, Sparkles } from "lucide-react";

export interface Checkpoint {
  id: string;
  goalType: "stories_read" | "reading_days" | "reading_minutes";
  goalTarget: number;
  rewardDescription: string;
  isActive: boolean;
}

export interface CheckpointProgress {
  id: string;
  checkpointId: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt: string | null;
  checkpoint?: Checkpoint;
}

interface RewardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoints: CheckpointProgress[];
  newlyEarned?: string[];
}

export function RewardsDialog({ open, onOpenChange, checkpoints, newlyEarned = [] }: RewardsDialogProps) {
  const activeCheckpoints = checkpoints.filter(cp => cp.checkpoint?.isActive);
  const completedCheckpoints = activeCheckpoints.filter(cp => cp.isCompleted);
  const inProgressCheckpoints = activeCheckpoints.filter(cp => !cp.isCompleted);

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "stories_read":
        return "Stories Read";
      case "reading_days":
        return "Reading Days";
      case "reading_minutes":
        return "Reading Minutes";
      default:
        return type;
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "stories_read":
        return <Star className="w-4 h-4" />;
      case "reading_days":
        return <Target className="w-4 h-4" />;
      case "reading_minutes":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-rewards">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Progress & Rewards
          </DialogTitle>
          <DialogDescription>
            Keep reading to unlock amazing rewards!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {newlyEarned.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Newly Earned Rewards!
              </h3>
              {newlyEarned.map((rewardId) => {
                const cp = checkpoints.find(c => c.id === rewardId);
                return (
                  <motion.div
                    key={rewardId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <Card className="p-3 bg-primary/10 border-primary/20">
                      <div className="flex items-start gap-2">
                        <Gift className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{cp?.checkpoint?.rewardDescription}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {getGoalTypeLabel(cp?.checkpoint?.goalType || "")}!
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {inProgressCheckpoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                In Progress
              </h3>
              {inProgressCheckpoints.map((cp) => {
                const progress = cp.checkpoint?.goalTarget
                  ? (cp.currentProgress / cp.checkpoint.goalTarget) * 100
                  : 0;
                
                return (
                  <Card key={cp.id} className="p-3" data-testid={`checkpoint-progress-${cp.id}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getGoalTypeIcon(cp.checkpoint?.goalType || "")}
                          <div>
                            <p className="text-sm font-medium">{cp.checkpoint?.rewardDescription}</p>
                            <p className="text-xs text-muted-foreground">
                              {getGoalTypeLabel(cp.checkpoint?.goalType || "")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {cp.currentProgress}/{cp.checkpoint?.goalTarget}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" data-testid={`progress-${cp.id}`} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {completedCheckpoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                <Trophy className="w-4 h-4" />
                Completed Rewards
              </h3>
              {completedCheckpoints.map((cp) => (
                <Card key={cp.id} className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" data-testid={`checkpoint-completed-${cp.id}`}>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cp.checkpoint?.rewardDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        {getGoalTypeLabel(cp.checkpoint?.goalType || "")} - Completed!
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeCheckpoints.length === 0 && (
            <Card className="p-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No active checkpoints yet. Ask your parents to set up some rewards!
              </p>
            </Card>
          )}
        </div>

        <Button 
          onClick={() => onOpenChange(false)} 
          className="w-full rounded-xl"
          data-testid="button-close-rewards"
        >
          Continue Reading
        </Button>
      </DialogContent>
    </Dialog>
  );
}
