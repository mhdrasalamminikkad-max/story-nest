import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrialBanner } from "@/components/TrialBanner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { BarChart3, Users, BookOpen, Bookmark, Trash2, ArrowLeft, CheckCircle, XCircle, Clock, Plus, Mic, Square, Volume2, CreditCard, Edit, DollarSign, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Story, SubscriptionPlan, InsertSubscriptionPlan, CoinSettings, PlanCoinCost } from "@shared/schema";
import { insertStorySchema, insertSubscriptionPlanSchema, updateCoinSettingsSchema } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalStories: number;
  totalBookmarks: number;
  averageStoriesPerUser: string;
  recentStoriesCount: number;
}

interface AdminUser {
  userId: string;
  readingTimeLimit: number;
  fullscreenLockEnabled: boolean;
  theme: string;
  storyCount: number;
  trialEndsAt: number | null;
  trialStartedAt: number | null;
  subscriptionStatus: string;
  coins: number;
  isAdmin: boolean;
  isBlocked: boolean;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviewingStory, setReviewingStory] = useState<Story | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAddStory, setShowAddStory] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [features, setFeatures] = useState<string[]>([""]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const form = useForm({
    resolver: zodResolver(insertStorySchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
      language: "english" as const,
      category: "educational" as const,
      storyType: "lesson" as const,
      audience: "both" as const,
      pdfUrl: "",
      audioUrl: "",
    },
  });

  const planForm = useForm({
    resolver: zodResolver(insertSubscriptionPlanSchema.omit({ features: true })),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "INR",
      billingPeriod: "monthly" as const,
      stripePriceId: "",
      isActive: true,
      maxStories: undefined,
    },
  });

  const { data: adminCheck, isLoading: checkingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/admin/stories"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: pendingStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/admin/pending-stories"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: coinSettings } = useQuery<CoinSettings>({
    queryKey: ["/api/admin/coin-settings"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: planCoinCosts = [] } = useQuery<PlanCoinCost[]>({
    queryKey: ["/api/admin/plan-coin-costs"],
    enabled: adminCheck?.isAdmin || false,
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <header className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="rounded-2xl"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <ThemeToggle />
          </header>
          <main className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You do not have permission to access the admin panel.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/stories/${storyId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Story deleted",
        description: "The story has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewStoryMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }: { id: string; action: "approve" | "reject"; rejectionReason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/review-story/${id}`, { action, rejectionReason });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: variables.action === "approve" ? "Story approved!" : "Story rejected",
        description: variables.action === "approve" 
          ? "The story is now published and visible to all users." 
          : "The story has been sent back to the author for revision.",
      });
      setReviewingStory(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to review story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ 
        title: "Story created and published!", 
        description: "Your story has been published and is now visible to all users." 
      });
      setShowAddStory(false);
      form.reset({
        title: "",
        content: "",
        summary: "",
        imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
        language: "english" as const,
        category: "educational" as const,
        storyType: "lesson" as const,
      });
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setIsRecording(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (data: InsertSubscriptionPlan) => {
      const endpoint = editingPlan 
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans";
      const method = editingPlan ? "PATCH" : "POST";
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans/public"] });
      toast({
        title: editingPlan ? "Plan updated!" : "Plan created!",
        description: editingPlan 
          ? "The subscription plan has been updated successfully." 
          : "The new subscription plan is now available.",
      });
      setShowPlanDialog(false);
      setEditingPlan(null);
      planForm.reset();
      setFeatures([""]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/subscription-plans/${planId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans/public"] });
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleBlockUserMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: variables.isBlocked ? "User unblocked" : "User blocked",
        description: variables.isBlocked 
          ? "The user can now access their account." 
          : "The user has been blocked from accessing their account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user block status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin: !isAdmin });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: variables.isAdmin ? "Admin access revoked" : "Admin access granted",
        description: variables.isAdmin 
          ? "The user no longer has admin privileges." 
          : "The user now has admin privileges.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user admin status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleBlockUser = (userId: string, isBlocked: boolean) => {
    toggleBlockUserMutation.mutate({ userId, isBlocked });
  };

  const handleToggleAdmin = (userId: string, isAdmin: boolean) => {
    toggleAdminMutation.mutate({ userId, isAdmin });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          (form.setValue as any)('voiceoverUrl', base64data);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Start reading your story!" });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ 
        title: "Microphone error", 
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Your voiceover has been saved!" });
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    (form.setValue as any)('voiceoverUrl', undefined);
    toast({ title: "Recording deleted" });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="rounded-2xl"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="font-heading text-4xl mb-2" data-testid="text-admin-title">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, stories, and view platform statistics</p>
            </div>

            <TrialBanner />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card data-testid="card-stat-users">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-stories">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-stories">{stats?.totalStories || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-bookmarks">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-bookmarks">{stats?.totalBookmarks || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-average">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Stories/User</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-stories">{stats?.averageStoriesPerUser || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="review" className="space-y-4">
              <TabsList data-testid="tabs-admin">
                <TabsTrigger value="review" data-testid="tab-review">
                  Story Review {pendingStories.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{pendingStories.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="stories" data-testid="tab-stories">All Stories</TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
                <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscriptions
                </TabsTrigger>
                <TabsTrigger value="coins" data-testid="tab-coins">
                  <Coins className="w-4 h-4 mr-2" />
                  Coin System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Story Reviews</CardTitle>
                    <CardDescription>Review and approve or reject stories submitted by parents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingStories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-pending">
                        No stories pending review
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pendingStories.map((story) => (
                          <Card key={story.id} className="rounded-2xl" data-testid={`card-pending-${story.id}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{story.title}</CardTitle>
                                  <CardDescription className="mt-1">{story.summary}</CardDescription>
                                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Submitted {formatDate(story.createdAt)}
                                    </Badge>
                                    <Badge variant="secondary">{story.userId.slice(0, 12)}...</Badge>
                                  </div>
                                </div>
                                <img 
                                  src={story.imageUrl} 
                                  alt={story.title}
                                  className="w-24 h-24 rounded-lg object-cover"
                                />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4 p-3 rounded-lg bg-muted/50 max-h-32 overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{story.content}</p>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => reviewStoryMutation.mutate({ id: story.id, action: "approve" })}
                                  disabled={reviewStoryMutation.isPending}
                                  className="rounded-2xl"
                                  data-testid={`button-approve-${story.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve & Publish
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => setReviewingStory(story)}
                                  disabled={reviewStoryMutation.isPending}
                                  className="rounded-2xl"
                                  data-testid={`button-reject-${story.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stories">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle>All Stories</CardTitle>
                      <CardDescription>Manage all stories across the platform</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowAddStory(true)}
                      className="rounded-2xl"
                      data-testid="button-create-story"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Story
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {allStories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-stories">
                        No stories yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allStories.map((story) => (
                            <TableRow key={story.id} data-testid={`row-story-${story.id}`}>
                              <TableCell className="font-medium">{story.title}</TableCell>
                              <TableCell className="max-w-xs truncate">{story.summary}</TableCell>
                              <TableCell>{formatDate(story.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{story.userId.slice(0, 8)}...</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteStoryMutation.mutate(story.id)}
                                  disabled={deleteStoryMutation.isPending}
                                  data-testid={`button-delete-story-${story.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View all registered users and their settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-users">
                        No users yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Story Count</TableHead>
                            <TableHead>Subscription Status</TableHead>
                            <TableHead>Trial Countdown</TableHead>
                            <TableHead>Coins</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Blocked</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user, index) => {
                            const trialDaysRemaining = user.trialEndsAt 
                              ? Math.max(0, Math.ceil((user.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
                              : null;
                            
                            return (
                              <TableRow key={user.userId} data-testid={`row-user-${index}`}>
                                <TableCell>
                                  <Badge variant="secondary">{user.userId.slice(0, 12)}...</Badge>
                                </TableCell>
                                <TableCell>{user.storyCount}</TableCell>
                                <TableCell>
                                  <Badge variant={user.subscriptionStatus === "active" ? "default" : user.subscriptionStatus === "trial" ? "secondary" : "outline"}>
                                    {user.subscriptionStatus || "unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.subscriptionStatus === "trial" ? (
                                    trialDaysRemaining !== null ? (
                                      <div className="flex items-center gap-2">
                                        <Clock className={`w-4 h-4 ${trialDaysRemaining <= 2 ? "text-orange-500" : "text-blue-500"}`} />
                                        <span className={trialDaysRemaining <= 2 ? "text-orange-500 font-semibold" : ""}>
                                          {trialDaysRemaining === 0 ? "Expires today" : 
                                           trialDaysRemaining === 1 ? "1 day left" : 
                                           `${trialDaysRemaining} days left`}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No trial data</span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Coins className="w-4 h-4 text-yellow-500" />
                                    <span>{user.coins}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.isAdmin ? "default" : "secondary"}>
                                    {user.isAdmin ? "Yes" : "No"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.isBlocked ? "destructive" : "secondary"}>
                                    {user.isBlocked ? "Yes" : "No"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant={user.isBlocked ? "default" : "destructive"}
                                      onClick={() => handleToggleBlockUser(user.userId, user.isBlocked || false)}
                                      className="rounded-2xl"
                                      data-testid={`button-toggle-block-${index}`}
                                    >
                                      {user.isBlocked ? "Unblock" : "Block"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={user.isAdmin ? "secondary" : "default"}
                                      onClick={() => handleToggleAdmin(user.userId, user.isAdmin || false)}
                                      className="rounded-2xl"
                                      data-testid={`button-toggle-admin-${index}`}
                                    >
                                      {user.isAdmin ? "Revoke Admin" : "Grant Admin"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle>Subscription Plans</CardTitle>
                        <CardDescription>Manage pricing plans and payment methods</CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingPlan(null);
                          setFeatures([""]);
                          planForm.reset();
                          setShowPlanDialog(true);
                        }}
                        className="rounded-2xl"
                        data-testid="button-add-plan"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subscriptionPlans.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-plans">
                        No subscription plans yet. Create your first plan to start accepting payments.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Billing Period</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptionPlans.map((plan, index) => (
                            <TableRow key={plan.id} data-testid={`row-plan-${index}`}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {plan.price} {plan.currency}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{plan.billingPeriod}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {plan.features.length} features
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={plan.isActive ? "default" : "outline"}>
                                  {plan.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingPlan(plan);
                                      setFeatures(plan.features.length > 0 ? plan.features : [""]);
                                      planForm.reset({
                                        name: plan.name,
                                        description: plan.description,
                                        price: parseFloat(plan.price),
                                        currency: plan.currency,
                                        billingPeriod: plan.billingPeriod as any,
                                        stripePriceId: plan.stripePriceId || "",
                                        isActive: plan.isActive,
                                        maxStories: plan.maxStories as any,
                                      });
                                      setShowPlanDialog(true);
                                    }}
                                    className="rounded-2xl"
                                    data-testid={`button-edit-plan-${index}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                                        deletePlanMutation.mutate(plan.id);
                                      }
                                    }}
                                    className="rounded-2xl"
                                    data-testid={`button-delete-plan-${index}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coins">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Coin Settings</CardTitle>
                      <CardDescription>Configure how many coins parents earn when their stories are approved</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-end gap-4 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Coins Per Approved Story</label>
                            <Input
                              type="number"
                              min="1"
                              value={coinSettings?.coinsPerStory || 10}
                              onChange={async (e) => {
                                const value = parseInt(e.target.value);
                                if (value > 0) {
                                  try {
                                    await apiRequest("PUT", "/api/admin/coin-settings", {
                                      coinsPerStory: value,
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/admin/coin-settings"] });
                                    toast({
                                      title: "Settings updated",
                                      description: `Parents will now earn ${value} coins per approved story.`,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to update coin settings.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              className="rounded-2xl"
                              data-testid="input-coins-per-story"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: <strong>{coinSettings?.coinsPerStory || 10}</strong> coins per story
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Coin Costs</CardTitle>
                      <CardDescription>Set how many coins are required to purchase each subscription plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscriptionPlans.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No subscription plans yet. Create plans in the Subscriptions tab first.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {subscriptionPlans.map((plan) => {
                            const currentCost = planCoinCosts.find(c => c.planId === plan.id);
                            return (
                              <div key={plan.id} className="flex items-center gap-4 p-4 rounded-2xl border flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                  <div className="font-medium">{plan.name}</div>
                                  <div className="text-sm text-muted-foreground">{plan.billingPeriod} plan</div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Coin cost"
                                    defaultValue={currentCost?.coinCost || 0}
                                    onChange={async (e) => {
                                      const value = parseInt(e.target.value);
                                      if (value >= 0) {
                                        try {
                                          await apiRequest("PUT", "/api/admin/plan-coin-costs", {
                                            planId: plan.id,
                                            coinCost: value,
                                          });
                                          queryClient.invalidateQueries({ queryKey: ["/api/admin/plan-coin-costs"] });
                                          toast({
                                            title: "Cost updated",
                                            description: `${plan.name} now costs ${value} coins.`,
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to update coin cost.",
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    }}
                                    className="rounded-2xl w-32"
                                    data-testid={`input-coin-cost-${plan.id}`}
                                  />
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Coins className="w-4 h-4" />
                                    <span>coins</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="p-4 rounded-2xl bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              <strong>Tip:</strong> Set coin cost to 0 to disable coin-based purchases for a plan.
                              Parents can still subscribe to that plan using regular payment methods.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      <Dialog open={!!reviewingStory} onOpenChange={(open) => {
        if (!open) {
          setReviewingStory(null);
          setRejectionReason("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl" data-testid="dialog-reject-story">
          <DialogHeader>
            <DialogTitle>Reject Story</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{reviewingStory?.title}". The author will see this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Explain why this story cannot be published..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-2xl min-h-[120px]"
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewingStory(null);
                setRejectionReason("");
              }}
              className="rounded-2xl"
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reviewingStory) {
                  reviewStoryMutation.mutate({
                    id: reviewingStory.id,
                    action: "reject",
                    rejectionReason: rejectionReason || "Story did not meet quality standards",
                  });
                }
              }}
              disabled={reviewStoryMutation.isPending || !rejectionReason.trim()}
              className="rounded-2xl"
              data-testid="button-confirm-reject"
            >
              {reviewStoryMutation.isPending ? "Rejecting..." : "Reject Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStory} onOpenChange={(open) => {
        if (!open) {
          setShowAddStory(false);
          form.reset({
            title: "",
            content: "",
            summary: "",
            imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
            language: "english" as const,
            category: "educational" as const,
            storyType: "lesson" as const,
            audience: "both" as const,
            pdfUrl: "",
            audioUrl: "",
          });
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          setAudioUrl(null);
          setIsRecording(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-story">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create New Story</DialogTitle>
            <DialogDescription>
              Create a new story that will be published immediately. As an admin, your stories bypass the review process.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => addStoryMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="The Magical Adventure" className="rounded-2xl" {...field} data-testid="input-admin-story-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="A brief description of the story" className="rounded-2xl" {...field} data-testid="input-admin-story-summary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Language *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl" data-testid="select-admin-story-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="malayalam">Malayalam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl" data-testid="select-admin-story-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="islamic">Islamic</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="moral">Moral</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="fairy-tale">Fairy Tale</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl" data-testid="select-admin-story-type">
                          <SelectValue placeholder="Select story type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="islamic">Islamic</SelectItem>
                        <SelectItem value="lesson">Lesson</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="fairy-tale">Fairy Tale</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="moral">Moral</SelectItem>
                        <SelectItem value="mythology">Mythology</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl" data-testid="select-admin-story-audience">
                          <SelectValue placeholder="Who can view this story?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="both">Both Parent & Child</SelectItem>
                        <SelectItem value="parent">Parent Only</SelectItem>
                        <SelectItem value="child">Child Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={"pdfUrl" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/story.pdf" 
                        className="rounded-2xl" 
                        {...field} 
                        data-testid="input-admin-story-pdf" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={"audioUrl" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/narration.mp3" 
                        className="rounded-2xl" 
                        {...field} 
                        data-testid="input-admin-story-audio" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Once upon a time..."
                        className="rounded-2xl min-h-[200px]"
                        {...field}
                        data-testid="input-admin-story-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={"voiceoverUrl" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice Recording (Required) *</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {!audioUrl && !isRecording && (
                          <Button
                            type="button"
                            onClick={startRecording}
                            variant="outline"
                            className="rounded-2xl w-full"
                            data-testid="button-admin-start-recording"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording Voiceover
                          </Button>
                        )}
                        
                        {isRecording && (
                          <div className="p-4 border-2 border-primary rounded-2xl bg-primary/5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="font-medium">Recording...</span>
                              </div>
                              <Button
                                type="button"
                                onClick={stopRecording}
                                variant="destructive"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-admin-stop-recording"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Stop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {audioUrl && !isRecording && (
                          <div className="p-4 border-2 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-primary" />
                                <span className="font-medium">Voiceover Ready</span>
                              </div>
                              <Button
                                type="button"
                                onClick={deleteRecording}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-admin-delete-recording"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <audio src={audioUrl} controls className="w-full rounded-2xl" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddStory(false);
                    form.reset({
                      title: "",
                      content: "",
                      summary: "",
                      imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
                      language: "english" as const,
                      category: "educational" as const,
                      storyType: "lesson" as const,
                    });
                  }}
                  className="rounded-2xl"
                  data-testid="button-cancel-story"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addStoryMutation.isPending}
                  className="rounded-2xl"
                  data-testid="button-submit-story"
                >
                  {addStoryMutation.isPending ? "Creating..." : "Create & Publish"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPlanDialog(false);
          setEditingPlan(null);
          planForm.reset();
          setFeatures([""]);
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-plan">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingPlan ? "Edit Plan" : "Create Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? "Update this subscription plan and pricing details." 
                : "Create a new subscription plan with pricing and features."}
            </DialogDescription>
          </DialogHeader>
          <Form {...planForm}>
            <form onSubmit={planForm.handleSubmit((data) => {
              const validFeatures = features.filter(f => f.trim().length > 0);
              
              if (validFeatures.length === 0) {
                toast({
                  title: "Features required",
                  description: "Please add at least one feature for the subscription plan.",
                  variant: "destructive",
                });
                return;
              }
              
              const submitData = { ...data, features: validFeatures };
              savePlanMutation.mutate(submitData);
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={planForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Plan" className="rounded-2xl" {...field} data-testid="input-plan-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="9.99" 
                          className="rounded-2xl" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          data-testid="input-plan-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={planForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this plan includes..."
                        className="rounded-2xl"
                        {...field}
                        data-testid="input-plan-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={planForm.control}
                  name="billingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl" data-testid="select-billing-period">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planForm.control}
                  name="maxStories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Stories (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Unlimited" 
                          className="rounded-2xl"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-max-stories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={planForm.control}
                name="stripePriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="price_xxxxx" className="rounded-2xl" {...field} data-testid="input-stripe-price-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Features</FormLabel>
                <div className="space-y-2 mt-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Feature description"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...features];
                          newFeatures[index] = e.target.value;
                          setFeatures(newFeatures);
                        }}
                        className="rounded-2xl"
                        data-testid={`input-feature-${index}`}
                      />
                      {features.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFeatures(features.filter((_, i) => i !== index));
                          }}
                          className="rounded-2xl"
                          data-testid={`button-remove-feature-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFeatures([...features, ""])}
                    className="rounded-2xl"
                    data-testid="button-add-feature"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <FormField
                control={planForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-active"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Plan</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Make this plan available for users to subscribe
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPlanDialog(false);
                    setEditingPlan(null);
                    planForm.reset();
                    setFeatures([""]);
                  }}
                  className="rounded-2xl"
                  data-testid="button-cancel-plan"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savePlanMutation.isPending}
                  className="rounded-2xl"
                  data-testid="button-submit-plan"
                >
                  {savePlanMutation.isPending ? "Saving..." : (editingPlan ? "Update Plan" : "Create Plan")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
