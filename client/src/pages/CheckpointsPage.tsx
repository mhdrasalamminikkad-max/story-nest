import { useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Target, Trophy, Trash2, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Checkpoint } from "@shared/schema";

type CheckpointWithProgress = Checkpoint & {
  currentProgress: number;
  completedAt: number | null;
  isCompleted: boolean;
};

export default function CheckpointsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalType: "stories_read" as "stories_read" | "reading_days" | "reading_minutes",
    goalTarget: 5,
    rewardTitle: "",
    rewardDescription: "",
  });

  const { data: checkpoints = [], isLoading } = useQuery<CheckpointWithProgress[]>({
    queryKey: ["/api/checkpoints/with-progress"],
  });

  const createCheckpointMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/checkpoints", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkpoints/with-progress"] });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        goalType: "stories_read",
        goalTarget: 5,
        rewardTitle: "",
        rewardDescription: "",
      });
      toast({
        title: "Checkpoint Created",
        description: "New checkpoint has been added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create checkpoint. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCheckpointMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/checkpoints/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkpoints/with-progress"] });
      toast({
        title: "Checkpoint Deleted",
        description: "The checkpoint has been removed.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCheckpointMutation.mutate(formData);
  };

  const getGoalTypeLabel = (type: string) => {
    const labels = {
      stories_read: "Stories Read",
      reading_days: "Reading Days",
      reading_minutes: "Reading Minutes",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-xl transition-all"
              onClick={() => setLocation("/")}
              data-testid="button-home-logo"
            >
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                StoryNest
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="rounded-2xl"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-heading font-bold">Checkpoints & Rewards</h1>
            </div>
            <p className="text-muted-foreground">
              Set reading goals and rewards for your child to earn
            </p>
          </div>

          <div className="flex justify-end mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl" data-testid="button-add-checkpoint">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Checkpoint
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Checkpoint</DialogTitle>
                  <DialogDescription>
                    Set a reading goal and reward for your child
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Checkpoint Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Read 5 Stories"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="input-checkpoint-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details about this checkpoint"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="input-checkpoint-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goalType">Goal Type</Label>
                      <Select
                        value={formData.goalType}
                        onValueChange={(value: typeof formData.goalType) =>
                          setFormData({ ...formData, goalType: value })
                        }
                      >
                        <SelectTrigger data-testid="select-goal-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stories_read">Stories Read</SelectItem>
                          <SelectItem value="reading_days">Reading Days</SelectItem>
                          <SelectItem value="reading_minutes">Reading Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalTarget">Target</Label>
                      <Input
                        id="goalTarget"
                        type="number"
                        min="1"
                        value={formData.goalTarget}
                        onChange={(e) =>
                          setFormData({ ...formData, goalTarget: parseInt(e.target.value) || 1 })
                        }
                        required
                        data-testid="input-goal-target"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rewardTitle">Reward Title</Label>
                    <Input
                      id="rewardTitle"
                      placeholder="e.g., Extra 30 Minutes of Play Time"
                      value={formData.rewardTitle}
                      onChange={(e) => setFormData({ ...formData, rewardTitle: e.target.value })}
                      required
                      data-testid="input-reward-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rewardDescription">Reward Description (Optional)</Label>
                    <Textarea
                      id="rewardDescription"
                      placeholder="Details about the reward"
                      value={formData.rewardDescription}
                      onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                      data-testid="input-reward-description"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 rounded-2xl"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCheckpointMutation.isPending}
                      className="flex-1 rounded-2xl"
                      data-testid="button-create-checkpoint"
                    >
                      {createCheckpointMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading checkpoints...</p>
            </div>
          ) : checkpoints.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Checkpoints Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first checkpoint to motivate your child's reading journey
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="rounded-2xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Checkpoint
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {checkpoints.map((checkpoint) => (
                <Card key={checkpoint.id} className="rounded-2xl" data-testid={`checkpoint-card-${checkpoint.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {checkpoint.title}
                          {checkpoint.isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                              <Award className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </CardTitle>
                        {checkpoint.description && (
                          <CardDescription className="mt-1">{checkpoint.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCheckpointMutation.mutate(checkpoint.id)}
                        disabled={deleteCheckpointMutation.isPending}
                        data-testid={`button-delete-${checkpoint.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{getGoalTypeLabel(checkpoint.goalType)}</span>
                        <span className="font-medium">
                          {checkpoint.currentProgress} / {checkpoint.goalTarget}
                        </span>
                      </div>
                      <Progress
                        value={getProgressPercentage(checkpoint.currentProgress, checkpoint.goalTarget)}
                        className="h-2"
                      />
                    </div>

                    <div className="bg-primary/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">Reward</span>
                      </div>
                      <p className="font-medium">{checkpoint.rewardTitle}</p>
                      {checkpoint.rewardDescription && (
                        <p className="text-sm text-muted-foreground mt-1">{checkpoint.rewardDescription}</p>
                      )}
                    </div>

                    {checkpoint.completedAt && (
                      <p className="text-xs text-muted-foreground text-center">
                        Completed on {new Date(checkpoint.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
