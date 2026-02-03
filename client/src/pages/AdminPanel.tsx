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
import { BarChart3, Users, BookOpen, Bookmark, Trash2, ArrowLeft, CheckCircle, XCircle, Clock, Plus, Mic, Square, Volume2, CreditCard, Edit, DollarSign, Coins, RefreshCw, Settings, ShieldAlert, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Story, SubscriptionPlan, InsertSubscriptionPlan, CoinSettings, PlanCoinCost, StoryCategory, StoryType, PaymentProof } from "@shared/schema";
import { insertStorySchema, insertSubscriptionPlanSchema, updateCoinSettingsSchema } from "@shared/schema";

interface CategoryMutationData {
  name: string;
  slug: string;
}

interface TypeMutationData {
  name: string;
  slug: string;
}

interface ReviewMutationData {
  id: string;
  action: "approve" | "reject";
  rejectionReason?: string;
  coinsReward?: number;
}

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

function PaymentProofList() {
  const { data: proofs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/payment-proofs"],
  });

  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) => {
      await apiRequest("POST", `/api/admin/payment-proofs/${id}/review`, { action, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
      toast({ title: "Success", description: "Payment review submitted successfully" });
    },
  });

  if (isLoading) return <div className="p-4 text-center">Loading payments...</div>;
  if (!proofs?.length) return <div className="p-4 text-center text-muted-foreground">No pending payments</div>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {proofs.map((proof) => (
        <Card key={proof.id} className="p-4 rounded-2xl border bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">User ID: <span className="font-normal">{proof.userId}</span></p>
              <p className="text-sm font-semibold">Plan ID: <span className="font-normal">{proof.planId}</span></p>
              <p className="text-sm font-semibold">Details: <span className="font-normal">{proof.paymentDetails || "N/A"}</span></p>
              <p className="text-sm font-semibold">Address: <span className="font-normal">{proof.address || "N/A"}</span></p>
              <a href={proof.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                View Receipt <CheckCircle className="w-3 h-3" />
              </a>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <Button 
                onClick={() => mutation.mutate({ id: proof.id, action: 'approve' })}
                disabled={mutation.isPending}
                className="rounded-xl w-full"
              >
                Approve Plan
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const reason = window.prompt("Rejection reason?");
                  if (reason !== null) mutation.mutate({ id: proof.id, action: 'reject', rejectionReason: reason });
                }}
                disabled={mutation.isPending}
                className="rounded-xl w-full text-destructive border-destructive hover:bg-destructive/10"
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  
  const [reviewingStory, setReviewingStory] = useState<Story | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAddStory, setShowAddStory] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [features, setFeatures] = useState<string[]>([""]);
  const [approvingStory, setApprovingStory] = useState<Story | null>(null);
  const [coinsToReward, setCoinsToReward] = useState<number>(10);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Admin credentials - change these to your secret credentials
  const ADMIN_PASSWORD = "caliph786786"; // Change this to your secret password

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast({
        title: "Success",
        description: "Admin panel access granted!",
        duration: 2000,
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid password. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
      setPasswordInput("");
    }
  };

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
      billingPeriod: "monthly" as any,
      stripePriceId: "",
      isActive: true,
      maxStories: undefined,
    },
  });

  const { data: adminCheck, isLoading: checkingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/admin/stories"],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: pendingStories = [], refetch: refetchPendingStories } = useQuery<Story[]>({
    queryKey: ["/api/admin/pending-stories"],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 5000, // Auto-refresh every 5 seconds for instant updates
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
    enabled: isAuthenticated,
  });

  const { data: coinSettings } = useQuery<CoinSettings>({
    queryKey: ["/api/admin/coin-settings"],
    enabled: isAuthenticated,
  });

  const { data: planCoinCosts = [] } = useQuery<PlanCoinCost[]>({
    queryKey: ["/api/admin/plan-coin-costs"],
    enabled: isAuthenticated,
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery<StoryCategory[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: storyTypes = [], refetch: refetchStoryTypes } = useQuery<StoryType[]>({
    queryKey: ["/api/story-types"],
    enabled: isAuthenticated,
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryMutationData) => {
      const res = await apiRequest("POST", "/api/admin/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category added" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const addTypeMutation = useMutation({
    mutationFn: async (data: TypeMutationData) => {
      const res = await apiRequest("POST", "/api/admin/story-types", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/story-types"] });
      toast({ title: "Story type added" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/story-types/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/story-types"] });
      toast({ title: "Story type deleted" });
    },
  });

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
    mutationFn: async ({ id, action, rejectionReason, coinsReward }: ReviewMutationData) => {
      const res = await apiRequest("POST", `/api/admin/review-story/${id}`, { action, rejectionReason, coinsReward });
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

  const handleToggleBlockUser = useCallback((userId: string, isBlocked: boolean) => {
    toggleBlockUserMutation.mutate({ userId, isBlocked });
  }, [toggleBlockUserMutation]);

  const handleToggleAdmin = useCallback((userId: string, isAdmin: boolean) => {
    toggleAdminMutation.mutate({ userId, isAdmin });
  }, [toggleAdminMutation]);

  const startRecording = useCallback(async () => {
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
      toast({ 
        title: "Microphone error", 
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [form, toast]);

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

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#FFF8E7] via-white to-[#FFE8CC] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20">
      <AnimatedBackground />
      
      {/* Password Authentication Dialog */}
      <Dialog open={showPasswordDialog && !isAuthenticated} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] border-2 border-[#F5C518]">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#F5C518] to-[#FFD54F] rounded-full flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8 text-[#E5683A]" />
            </div>
            <DialogTitle className="text-center text-2xl text-[#E5683A] font-bold">🔐 Admin Panel Access</DialogTitle>
            <DialogDescription className="text-center text-[#d94f25] font-semibold">
              Enter the admin password to access the panel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#E5683A]">Secret Password</label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="rounded-2xl border-2 border-[#F5C518] focus:border-[#E5683A] focus:ring-[#F5C518]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="rounded-2xl border-2 border-[#F5C518] text-[#E5683A] hover:bg-[#FFF8E7]"
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1"
            >
              <Button
                onClick={handlePasswordSubmit}
                className="w-full rounded-2xl bg-gradient-to-r from-[#F5C518] via-[#FFD54F] to-[#FFC107] hover:from-[#febc2d] hover:via-[#FFD166] hover:to-[#FFBF00] text-gray-800 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                🔓 Access Admin Panel
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show loading or access denied if not authenticated */}
      {!isAuthenticated ? (
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] border-2 border-[#F5C518] shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-4"
              >
                🔒
              </motion.div>
              <p className="text-lg font-bold text-[#E5683A] mb-2">Admin Panel Locked</p>
              <p className="text-sm text-[#d94f25]">Please enter the admin password to proceed</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative z-10">
        <header className="bg-gradient-to-r from-[#E5683A] to-[#d94f25] shadow-xl sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                className="rounded-full text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="font-heading text-2xl text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" />
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <motion.div whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-3xl border-2 border-[#F5C518] bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#E5683A] to-[#d94f25] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#d94f25] uppercase tracking-wider font-bold">Total Users</p>
                    <p className="text-3xl font-heading text-[#E5683A]">{stats?.totalUsers || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-3xl border-2 border-[#F5C518] bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#d94f25] uppercase tracking-wider font-bold">Total Stories</p>
                    <p className="text-3xl font-heading text-[#E5683A]">{stats?.totalStories || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-3xl border-2 border-[#F5C518] bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#d94f25] uppercase tracking-wider font-bold">Total Bookmarks</p>
                    <p className="text-3xl font-heading text-[#E5683A]">{stats?.totalBookmarks || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-3xl border-2 border-[#F5C518] bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#E5683A] to-[#d94f25] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#d94f25] uppercase tracking-wider font-bold">Avg Stories/User</p>
                    <p className="text-3xl font-heading text-[#E5683A]">{stats?.averageStoriesPerUser || "0"}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
              <Card className="rounded-3xl border-2 border-[#F5C518] bg-gradient-to-br from-[#FFF8E7] to-[#FFE8CC] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#d94f25] uppercase tracking-wider font-bold">Recent Stories</p>
                    <p className="text-3xl font-heading text-[#E5683A]">{stats?.recentStoriesCount || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="stories" className="space-y-6">
            <TabsList className="bg-white shadow-md border-2 border-[#F5C518] rounded-3xl p-2 h-auto flex flex-wrap gap-2 w-full">
              <TabsTrigger value="stories" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Stories
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all relative">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Review Pending
                {pendingStories.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-lg font-bold">
                    {pendingStories.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Proofs
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Users className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="plans" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <DollarSign className="w-4 h-4 mr-2" />
                Subscription Plans
              </TabsTrigger>
              <TabsTrigger value="coins" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Coins className="w-4 h-4 mr-2" />
                Coin System
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-2xl flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E5683A] data-[state=active]:to-[#d94f25] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Settings className="w-4 h-4 mr-2" />
                Content Options
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories">
              <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518] pb-4">
                  <div>
                    <CardTitle className="font-heading text-2xl text-[#E5683A]">📚 Published Stories</CardTitle>
                    <CardDescription className="text-[#d94f25]">All stories currently visible on the platform</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowAddStory(true)}
                    className="rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Story
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                          <TableHead className="text-[#E5683A] font-bold">Story</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Language</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Category</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Type</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Author</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Audience</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Status</TableHead>
                          <TableHead className="text-right text-[#E5683A] font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allStories.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                              No stories found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          allStories.map((story, idx) => (
                            <TableRow key={story.id} className={idx % 2 === 0 ? 'bg-[#FFF8E7]/30' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#F5C518] shadow-md">
                                    <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="font-medium line-clamp-1 text-[#E5683A]">{story.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize rounded-lg bg-[#FFF8E7] border-[#F5C518] text-[#E5683A]">
                                  {story.language}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize rounded-lg bg-[#FFE8CC] text-[#d94f25]">
                                  {story.category}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-[#E5683A] font-medium capitalize">{story.storyType}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-mono truncate max-w-[100px] text-[#E5683A]">{story.userId.substring(0, 8)}</span>
                                  {story.isCreatorAdmin && (
                                    <Badge variant="default" className="w-fit text-[10px] h-4 py-0 rounded-full bg-[#E5683A]">Admin</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize rounded-lg bg-[#FFF8E7] border-[#F5C518] text-[#E5683A]">
                                  {story.audience}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`capitalize rounded-lg font-bold ${
                                    story.status === 'published' ? 'bg-green-100 text-green-700' :
                                    story.status === 'pending_review' ? 'bg-[#FFE8CC] text-[#d94f25]' :
                                    story.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {story.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteStoryMutation.mutate(story.id)}
                                  disabled={deleteStoryMutation.isPending}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                  <CardTitle className="font-heading text-2xl text-[#E5683A]">⏳ Pending Review</CardTitle>
                  <CardDescription className="text-[#d94f25]">Review and approve user-submitted stories</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {pendingStories.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-[#E5683A]">All caught up!</p>
                      <p className="text-[#d94f25]">There are no pending stories to review right now.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingStories.map((story) => (
                        <motion.div key={story.id} whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
                          <Card className="rounded-3xl border-2 border-[#F5C518] overflow-hidden hover:shadow-xl transition-all bg-gradient-to-br from-white to-[#FFF8E7]">
                            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#FFE8CC] to-[#FFF8E7]">
                              <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Badge className="bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white shadow-lg">
                                  {story.language}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                              <div>
                                <h3 className="font-heading text-lg text-[#E5683A] leading-tight mb-1">{story.title}</h3>
                                <p className="text-sm text-[#d94f25] line-clamp-2">{story.summary}</p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-[10px] bg-[#FFF8E7] border-[#F5C518] text-[#E5683A]">{story.category}</Badge>
                                <Badge variant="outline" className="text-[10px] bg-[#FFE8CC] border-[#F5C518] text-[#d94f25]">{story.storyType}</Badge>
                                <Badge variant="outline" className="text-[10px] bg-[#FFF8E7] border-[#F5C518] text-[#E5683A]">By: {story.userId.substring(0, 8)}...</Badge>
                              </div>

                              <div className="pt-2 flex gap-2">
                                <Button 
                                  onClick={() => setReviewingStory(story)}
                                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white hover:shadow-lg transition-all"
                                >
                                  Review Story
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => {
                                    window.open(`/story/${story.id}`, '_blank');
                                  }}
                                  className="rounded-2xl border-[#F5C518] hover:bg-[#FFF8E7]"
                                >
                                  <BookOpen className="w-4 h-4 text-[#E5683A]" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                  <CardTitle className="font-heading text-2xl text-[#E5683A]">💳 Payment Reviews</CardTitle>
                  <CardDescription className="text-[#d94f25]">Approve or reject manual subscription payments</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PaymentProofList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518] pb-4">
                  <CardTitle className="font-heading text-2xl text-[#E5683A]">👥 User Management</CardTitle>
                  <CardDescription className="text-[#d94f25]">Manage user accounts, admin status, and blocks</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                          <TableHead className="text-[#E5683A] font-bold">User</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Subscription</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Coins</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Stories</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Trial Ends</TableHead>
                          <TableHead className="text-[#E5683A] font-bold">Status</TableHead>
                          <TableHead className="text-right text-[#E5683A] font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, idx) => (
                          <TableRow key={user.userId} className={idx % 2 === 0 ? 'bg-[#FFF8E7]/30' : ''}>
                            <TableCell className="font-mono text-xs max-w-[150px] truncate text-[#E5683A]">
                              {user.userId.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize rounded-lg bg-[#FFF8E7] border-[#F5C518] text-[#E5683A]">
                                {user.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-[#E5683A] font-bold">
                                <Coins className="w-4 h-4 text-[#FFD54F]" />
                                <span>{user.coins}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#E5683A] font-bold">{user.storyCount}</TableCell>
                            <TableCell className="text-[#d94f25]">
                              {user.trialEndsAt ? formatDate(user.trialEndsAt) : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {user.isAdmin && <Badge className="bg-[#E5683A] text-white rounded-full">Admin</Badge>}
                                {user.isBlocked && <Badge variant="destructive" className="rounded-full">Blocked</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAdmin(user.userId, user.isAdmin)}
                                  className="h-8 rounded-lg text-[#E5683A] hover:bg-[#FFF8E7]"
                                >
                                  {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleBlockUser(user.userId, user.isBlocked)}
                                  className={`h-8 rounded-lg ${user.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                  {user.isBlocked ? "Unblock" : "Block"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans">
              <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518] pb-4">
                  <div>
                    <CardTitle className="font-heading text-2xl text-[#E5683A]">🎯 Subscription Plans</CardTitle>
                    <CardDescription className="text-[#d94f25]">Manage available subscription tiers</CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingPlan(null);
                      planForm.reset();
                      setFeatures([""]);
                      setShowPlanDialog(true);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Plan
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptionPlans.map((plan) => (
                      <motion.div key={plan.id} whileHover={{ translateY: -4 }} transition={{ duration: 0.2 }}>
                        <Card className="rounded-3xl border-2 border-[#F5C518] overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-[#FFF8E7]">
                          <div className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] p-4 border-b-2 border-[#F5C518] flex justify-between items-start">
                            <div>
                              <h3 className="font-heading text-lg text-[#E5683A]">{plan.name}</h3>
                              <p className="text-3xl font-bold text-[#d94f25]">{plan.currency} {plan.price}</p>
                              <p className="text-xs text-[#d94f25] capitalize font-bold">{plan.billingPeriod}</p>
                            </div>
                            <Badge variant={plan.isActive ? "default" : "outline"} className={`rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : ''}`}>
                              {plan.isActive ? "✓ Active" : "Inactive"}
                            </Badge>
                          </div>
                          <CardContent className="p-4 flex-1">
                            <p className="text-sm text-[#d94f25] mb-4 line-clamp-2">{plan.description}</p>
                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#E5683A]">Features:</p>
                              <ul className="space-y-1">
                                {plan.features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="text-sm text-[#E5683A] flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    {f}
                                  </li>
                                ))}
                                {plan.features.length > 3 && (
                                  <li className="text-xs text-[#d94f25] font-bold">+{plan.features.length - 3} more</li>
                                )}
                              </ul>
                            </div>
                          </CardContent>
                          <div className="p-4 border-t-2 border-[#F5C518] bg-[#FFF8E7] flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 rounded-2xl border-[#F5C518] text-[#E5683A] hover:bg-white"
                              onClick={() => {
                                setEditingPlan(plan);
                                planForm.reset({
                                  name: plan.name,
                                  description: plan.description,
                                  price: parseFloat(plan.price as string),
                                  currency: plan.currency,
                                  billingPeriod: plan.billingPeriod,
                                  stripePriceId: plan.stripePriceId || "",
                                  isActive: plan.isActive,
                                  maxStories: plan.maxStories || undefined,
                                });
                                setFeatures(plan.features);
                                setShowPlanDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-2xl text-red-500 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this plan?")) {
                                  deletePlanMutation.mutate(plan.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coins">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                    <CardTitle className="font-heading text-2xl text-[#E5683A]">🪙 Coin Settings</CardTitle>
                    <CardDescription className="text-[#d94f25]">Configure the story unlock cost</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form 
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const coins = parseInt(formData.get("coinsPerStory") as string);
                        apiRequest("PATCH", "/api/admin/coin-settings", { coinsPerStory: coins })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/admin/coin-settings"] });
                            toast({ title: "Settings updated" });
                          });
                      }}
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[#E5683A]">Coins required to unlock one story</label>
                        <div className="flex gap-4">
                          <Input 
                            name="coinsPerStory" 
                            type="number" 
                            defaultValue={coinSettings?.coinsPerStory || 10} 
                            min={1}
                            className="rounded-2xl border-[#F5C518] border-2 focus:border-[#E5683A] text-[#E5683A]"
                          />
                          <Button type="submit" className="rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white">Save</Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518]">
                    <CardTitle className="font-heading text-2xl text-[#E5683A]">📋 Plan Coin Costs</CardTitle>
                    <CardDescription className="text-[#d94f25]">Cost in coins for each subscription plan</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {subscriptionPlans.map((plan) => {
                        const coinCost = planCoinCosts.find(c => c.planId === plan.id)?.coinCost || 0;
                        return (
                          <div key={plan.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] rounded-2xl border-2 border-[#F5C518]">
                            <div>
                              <p className="font-bold text-[#E5683A]">{plan.name}</p>
                              <p className="text-xs text-[#d94f25] capitalize">{plan.billingPeriod}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Input 
                                type="number" 
                                value={coinCost} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  apiRequest("POST", "/api/admin/plan-coin-costs", { planId: plan.id, coinCost: val })
                                    .then(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/plan-coin-costs"] }));
                                }}
                                className="w-24 rounded-xl border-[#F5C518] text-[#E5683A] font-bold"
                              />
                              <Coins className="w-5 h-5 text-[#FFD54F]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Categories */}
                <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518] pb-4">
                    <div>
                      <CardTitle className="font-heading text-2xl text-[#E5683A]">🏷️ Categories</CardTitle>
                      <CardDescription className="text-[#d94f25]">Story categories for grouping</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <form 
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        const slug = name.toLowerCase().replace(/ /g, "-");
                        addCategoryMutation.mutate({ name, slug });
                        e.currentTarget.reset();
                      }}
                    >
                      <Input name="name" placeholder="New category name" className="rounded-2xl border-[#F5C518] border-2 flex-1" required />
                      <Button type="submit" className="rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white">Add</Button>
                    </form>

                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] rounded-2xl border-2 border-[#F5C518]">
                          <span className="font-bold text-[#E5683A]">{cat.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(cat.id)}
                            className="text-red-500 h-8 w-8 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Story Types */}
                <Card className="rounded-3xl border-2 border-[#F5C518] shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-b-2 border-[#F5C518] pb-4">
                    <CardTitle className="font-heading text-2xl text-[#E5683A]">📖 Story Types</CardTitle>
                    <CardDescription className="text-[#d94f25]">Types of stories (lesson, fable, etc)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <form 
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        const slug = name.toLowerCase().replace(/ /g, "-");
                        addTypeMutation.mutate({ name, slug });
                        e.currentTarget.reset();
                      }}
                    >
                      <Input name="name" placeholder="New story type" className="rounded-2xl border-[#F5C518] border-2 flex-1" required />
                      <Button type="submit" className="rounded-2xl bg-gradient-to-r from-[#E5683A] to-[#d94f25] text-white">Add</Button>
                    </form>

                    <div className="space-y-2">
                      {storyTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] rounded-2xl border-2 border-[#F5C518]">
                          <span className="font-bold text-[#E5683A]">{type.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTypeMutation.mutate(type.id)}
                            className="text-red-500 h-8 w-8 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Review Dialog */}
      <Dialog open={!!reviewingStory} onOpenChange={() => setReviewingStory(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-purple-600 text-white">
            <DialogTitle className="font-heading text-2xl">Review: {reviewingStory?.title}</DialogTitle>
            <DialogDescription className="text-purple-100">
              Check the story content and decide its status
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</p>
                <p className="font-medium capitalize">{reviewingStory?.language}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audience</p>
                <p className="font-medium capitalize">{reviewingStory?.audience}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{reviewingStory?.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{reviewingStory?.storyType}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary</p>
              <p className="text-sm bg-muted/50 p-3 rounded-xl">{reviewingStory?.summary}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Preview</p>
              <div className="text-sm bg-muted/50 p-4 rounded-xl border prose dark:prose-invert max-w-none">
                {reviewingStory?.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Review Actions
              </h4>
              <div className="space-y-2">
                <p className="text-sm font-medium">Approval Bonus (Coins)</p>
                <Input 
                  type="number" 
                  value={coinsToReward}
                  onChange={(e) => setCoinsToReward(parseInt(e.target.value) || 0)}
                  className="rounded-xl"
                  placeholder="Reward coins for quality"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Rejection Reason (if rejecting)</p>
                <Textarea 
                  placeholder="Tell the author why the story was rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/30 flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                if (!rejectionReason) {
                  toast({ title: "Error", description: "Please provide a rejection reason.", variant: "destructive" });
                  return;
                }
                reviewStoryMutation.mutate({
                  id: reviewingStory!.id,
                  action: "reject",
                  rejectionReason,
                });
              }}
              disabled={reviewStoryMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Story
            </Button>
            <Button
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
              onClick={() => {
                reviewStoryMutation.mutate({
                  id: reviewingStory!.id,
                  action: "approve",
                  coinsReward: coinsToReward,
                });
              }}
              disabled={reviewStoryMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Story Dialog */}
      <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-purple-600">Create Admin Story</DialogTitle>
            <DialogDescription>
              Create and publish a high-quality story directly to the platform.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => addStoryMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a magical title..." className="rounded-xl" {...field} />
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
                          <Textarea 
                            placeholder="What is this story about? (Max 200 chars)" 
                            className="rounded-xl resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
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
                      name="audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="parent">Parent Only</SelectItem>
                              <SelectItem value="child">Child Only</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                              ))}
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
                          <FormLabel>Story Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {storyTypes.map((type) => (
                                <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Unsplash URL or other..." className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                    <h4 className="font-heading text-purple-600 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Narration
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {!audioUrl ? (
                        <Button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          variant={isRecording ? "destructive" : "outline"}
                          className="rounded-xl flex-1"
                        >
                          {isRecording ? (
                            <><Square className="w-4 h-4 mr-2" /> Stop Recording</>
                          ) : (
                            <><Mic className="w-4 h-4 mr-2" /> Start Recording</>
                          )}
                        </Button>
                      ) : (
                        <div className="w-full space-y-3">
                          <audio src={audioUrl} controls className="w-full h-10" />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={deleteRecording}
                            className="w-full text-red-500 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Narration
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Once upon a time..." 
                            className="rounded-2xl min-h-[500px] leading-relaxed resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pdfUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PDF File URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="audioUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audio File URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                  disabled={addStoryMutation.isPending}
                >
                  {addStoryMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                  ) : (
                    "Publish Admin Story"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-purple-600">
              {editingPlan ? "Edit Subscription Plan" : "Create New Plan"}
            </DialogTitle>
          </DialogHeader>

          <Form {...planForm}>
            <form 
              onSubmit={planForm.handleSubmit((data) => {
                const finalData = { ...data, features };
                savePlanMutation.mutate(finalData as any);
              })} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={planForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Pass" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={planForm.control}
                  name="billingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={planForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" className="rounded-xl" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={planForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="INR" className="rounded-xl" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="Unlimited" className="rounded-xl" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                      <Textarea placeholder="What's included in this plan?" className="rounded-xl resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Features List</FormLabel>
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={feature} 
                      onChange={(e) => {
                        const newFeatures = [...features];
                        newFeatures[index] = e.target.value;
                        setFeatures(newFeatures);
                      }}
                      placeholder="Enter feature..."
                      className="rounded-xl flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (features.length > 1) {
                          setFeatures(features.filter((_, i) => i !== index));
                        }
                      }}
                      className="rounded-xl text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFeatures([...features, ""])}
                  className="w-full rounded-xl border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Feature
                </Button>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full rounded-2xl bg-purple-600 hover:bg-purple-700"
                  disabled={savePlanMutation.isPending}
                >
                  {savePlanMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : (editingPlan ? "Update Plan" : "Create Plan")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
      )}
    </div>
  );
}
