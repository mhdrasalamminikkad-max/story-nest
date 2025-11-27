import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StoryCard } from "@/components/StoryCard";
import { TrialBanner } from "@/components/TrialBanner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Plus, Play, LogOut, BookmarkCheck, Clock, CheckCircle, XCircle, FileText, Mic, Square, Trash2, Volume2, CreditCard, Coins, Search, Target, Home, BookOpen, Upload, FileAudio, Loader2, Settings as SettingsIcon, Lock, Trophy, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Story, ParentSettings } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStorySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { fakeAuth } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { uploadPDFFile, uploadAudioFile, uploadVoiceoverBlob } from "@/lib/firebase-storage";
import teddyImage from "@assets/generated_images/Teddy_bear_reading_story_502f26a8.png";
import bunnyImage from "@assets/generated_images/Bunny_on_cloud_e358044b.png";
import owlImage from "@assets/generated_images/Owl_with_lantern_4320ef2c.png";
import foxImage from "@assets/generated_images/Fox_reading_by_candlelight_2780dc73.png";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Progress } from "@/components/ui/progress";
import tellMammaLogo from "@assets/Screenshot_26-11-2025_22037__1764174656102.jpeg";

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [showAddStory, setShowAddStory] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storyTypeFilter, setStoryTypeFilter] = useState<string>("all");
  const [showEditPin, setShowEditPin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceoverBase64, setVoiceoverBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // File upload states
  const [pdfFile, setPdfFile] = useState<{ name: string; data: string } | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
  const [audioFile, setAudioFile] = useState<{ name: string; data: string } | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: mySubmissions = [], isLoading: loadingSubmissions } = useQuery<Story[]>({
    queryKey: ["/api/stories/my-submissions"],
  });

  const { data: bookmarks = [] } = useQuery<string[]>({
    queryKey: ["/api/bookmarks"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const { data: parentSettings, isLoading: settingsLoading } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  // Redirect to setup if user hasn't completed setup
  useEffect(() => {
    if (!settingsLoading && !parentSettings) {
      setLocation("/setup");
    }
  }, [settingsLoading, parentSettings, setLocation]);

  const storiesWithBookmarks = stories.map(story => ({
    ...story,
    isBookmarked: bookmarks.includes(story.id),
  }));

  const displayedStories = storiesWithBookmarks
    .filter(s => {
      // Filter by bookmark
      if (filterBookmarked && !s.isBookmarked) return false;
      
      // Filter by language
      if (languageFilter !== "all" && s.language !== languageFilter) return false;
      
      // Filter by category
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      
      // Filter by story type
      if (storyTypeFilter !== "all" && s.storyType !== storyTypeFilter) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(query) ||
          s.summary.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

  const form = useForm({
    resolver: zodResolver(insertStorySchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      imageUrl: teddyImage,
      language: "english" as const,
      category: "educational" as const,
      storyType: "lesson" as const,
      audience: "both" as const,
      pdfUrl: "",
      audioUrl: "",
      voiceoverUrl: undefined,
    },
  });

  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowAddStory(false);
      setAudioUrl(null);
      setVoiceoverBase64(null);
      setIsRecording(false);
      form.reset({
        title: "",
        content: "",
        summary: "",
        imageUrl: teddyImage,
        language: "english" as const,
        category: "educational" as const,
        storyType: "lesson" as const,
        audience: "both" as const,
        pdfUrl: "",
        audioUrl: "",
        voiceoverUrl: undefined,
      });
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Filter out status to prevent parents from changing it
      const { status, ...safeData } = data;
      const res = await apiRequest("PATCH", `/api/stories/${id}`, safeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      setEditingStory(null);
      setAudioUrl(null);
      setVoiceoverBase64(null);
      setIsRecording(false);
      form.reset({
        title: "",
        content: "",
        summary: "",
        imageUrl: teddyImage,
        language: "english" as const,
        category: "educational" as const,
        storyType: "lesson" as const,
        audience: "both" as const,
        pdfUrl: "",
        audioUrl: "",
        voiceoverUrl: undefined,
      });
    },
  });

  const submitStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/stories/${id}/submit`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const isBookmarked = bookmarks.includes(storyId);
      if (isBookmarked) {
        const res = await apiRequest("DELETE", `/api/bookmarks/${storyId}`, undefined);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/bookmarks", { storyId });
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: async ({ oldPin, newPin }: { oldPin: string; newPin: string }) => {
      // First verify old PIN
      const verifyRes = await apiRequest("POST", "/api/verify-pin", { pin: oldPin });
      const verifyData = await verifyRes.json();
      
      if (!verifyData.valid) {
        throw new Error("Invalid current PIN");
      }
      
      // Then update to new PIN
      const updateRes = await apiRequest("POST", "/api/parent-settings", {
        pin: newPin,
        childName: parentSettings?.childName ?? "",
        readingTimeLimit: parentSettings?.readingTimeLimit ?? 30,
        fullscreenLockEnabled: parentSettings?.fullscreenLockEnabled ?? true,
        theme: parentSettings?.theme ?? "day",
      });
      return await updateRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
      setShowEditPin(false);
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      toast({
        title: "PIN Updated",
        description: "Your child lock PIN has been updated successfully",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update PIN. Please check your current PIN.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const handleSignOut = () => {
    fakeAuth.signOut();
    setLocation("/");
  };

  const handleUpdatePin = () => {
    if (!oldPin || oldPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Current PIN must be 4 digits",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!newPin || newPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "New PIN must be 4 digits",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (newPin !== confirmNewPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation PIN do not match",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    updatePinMutation.mutate({ oldPin, newPin });
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Upload to Firebase Storage and get download URL
        try {
          const userId = user?.uid || `temp-${Date.now()}`;
          const downloadURL = await uploadVoiceoverBlob(audioBlob, userId);
          setVoiceoverBase64(downloadURL);
          (form.setValue as any)('voiceoverUrl', downloadURL);
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to upload voiceover recording",
            variant: "destructive",
            duration: 4000,
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Could not access your microphone",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    // Only revoke ObjectURLs (blob:), not base64 data URLs
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setVoiceoverBase64(null);
    (form.setValue as any)('voiceoverUrl', undefined);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Check file size (limit to 5MB for base64 storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "PDF must be smaller than 5MB",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Create blob URL immediately for instant display
    const blobUrl = URL.createObjectURL(file);
    setPdfFile({ name: file.name, data: blobUrl });

    // Convert to base64 instantly (no upload needed)
    setPdfUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Save base64 string directly to form
        (form.setValue as any)('pdfUrl', base64String);
        setPdfUploading(false);
      };
      reader.onerror = () => {
        setPdfUploading(false);
        toast({
          title: "Upload failed",
          description: "Could not read PDF file",
          variant: "destructive",
          duration: 4000,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setPdfUploading(false);
      toast({
        title: "PDF conversion failed",
        description: "Could not process PDF file",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleAudioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc.)",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Check file size (limit to 5MB for base64 storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Audio must be smaller than 5MB",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Create blob URL immediately for instant display
    const blobUrl = URL.createObjectURL(file);
    setAudioFile({ name: file.name, data: blobUrl });

    // Convert to base64 instantly (no upload needed)
    setAudioUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Save base64 string directly to form
        (form.setValue as any)('audioUrl', base64String);
        setAudioUploading(false);
      };
      reader.onerror = () => {
        setAudioUploading(false);
        toast({
          title: "Upload failed",
          description: "Could not read audio file",
          variant: "destructive",
          duration: 4000,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setAudioUploading(false);
      toast({
        title: "Audio conversion failed",
        description: "Could not process audio file",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const deletePdfFile = () => {
    setPdfFile(null);
    setPdfProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    (form.setValue as any)('pdfUrl', '');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const deleteAudioFile = () => {
    setAudioFile(null);
    setAudioProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    (form.setValue as any)('audioUrl', '');
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setAudioUrl(story.voiceoverUrl || null);
    setVoiceoverBase64(story.voiceoverUrl || null);
    
    // Set existing file states
    if (story.pdfUrl) {
      setPdfFile({ name: "Existing PDF", data: story.pdfUrl });
      setPdfProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    } else {
      setPdfFile(null);
      setPdfProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    }
    
    if (story.audioUrl) {
      setAudioFile({ name: "Existing Audio", data: story.audioUrl });
      setAudioProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    } else {
      setAudioFile(null);
      setAudioProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
    }
    
    form.reset({
      title: story.title,
      content: story.content,
      summary: story.summary,
      imageUrl: story.imageUrl,
      language: story.language as any,
      category: story.category as any,
      storyType: story.storyType as any,
      audience: story.audience as any,
      pdfUrl: story.pdfUrl || "",
      audioUrl: story.audioUrl || "",
      voiceoverUrl: story.voiceoverUrl as any,
    });
  };

  const handleFormSubmit = async (data: any, isDraft: boolean = false) => {
    // Check if either voice recording or audio file is present (only for non-draft submissions)
    const hasVoiceover = voiceoverBase64 || data.voiceoverUrl;
    const hasAudio = audioFile || data.audioUrl;
    
    if (!isDraft && !hasVoiceover && !hasAudio) {
      toast({
        title: "Audio Required",
        description: "Please record your voice OR upload an audio file before submitting",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    // Wait for uploads to complete if they're in progress
    // Show loading indicator on button but don't block with toast
    if (pdfUploading || audioUploading) {
      // Wait in a loop until uploads complete
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!pdfUploading && !audioUploading) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    // Filter out blob URLs - only allow Firebase download URLs
    const filterBlobUrl = (url: string | undefined) => {
      if (!url) return undefined;
      if (url.startsWith('blob:')) return undefined;
      return url;
    };
    
    const submissionData = {
      ...data,
      pdfUrl: filterBlobUrl(data.pdfUrl),
      audioUrl: filterBlobUrl(data.audioUrl),
      voiceoverUrl: voiceoverBase64 || data.voiceoverUrl,
    };
    
    // Close dialog immediately for instant feedback
    setShowAddStory(false);
    toast({
      title: editingStory ? "Story saved!" : (isDraft ? "Draft saved!" : "Story created!"),
      description: isDraft ? "Your draft has been saved" : "Your story has been saved successfully",
      duration: 2000,
    });
    
    // Submit mutation
    if (editingStory) {
      updateStoryMutation.mutate({ id: editingStory.id, data: submissionData });
    } else {
      addStoryMutation.mutate(submissionData);
    }
  };

  const getStatusBadge = (story: Story) => {
    // Backend sets rejected stories back to "draft" with rejectionReason
    if (story.status === "draft" && story.rejectionReason) {
      return <Badge variant="destructive" data-testid={`badge-rejected`}><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    
    switch (story.status) {
      case "draft":
        return <Badge variant="secondary" data-testid={`badge-draft`}><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "pending_review":
        return <Badge variant="outline" data-testid={`badge-pending`}><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "published":
        return <Badge variant="default" data-testid={`badge-published`}><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const imageOptions = [
    { url: teddyImage, label: "Teddy Bear" },
    { url: bunnyImage, label: "Bunny" },
    { url: owlImage, label: "Owl" },
    { url: foxImage, label: "Fox" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <MobileHeader title="Dashboard" />
        
        <header className="hidden md:block border-b-2 border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background dark:from-background dark:via-primary/10 dark:to-background backdrop-blur-xl sticky top-0 z-20 shadow-lg">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5 flex justify-between items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <motion.div 
                className="cursor-pointer hover-elevate active-elevate-2 rounded-2xl transition-all"
                onClick={() => setLocation("/")}
                data-testid="button-home-logo"
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src={tellMammaLogo} 
                  alt="TELL MAMMA" 
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </motion.div>
              <div className="h-7 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h2 className="font-heading text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Parent Dashboard</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {parentSettings && (
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 font-bold border-2 border-yellow-400 dark:border-yellow-700 shadow-lg" data-testid="badge-coin-balance">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-bounce" />
                    <span>{parentSettings.coins}</span>
                    <span className="ml-2 hidden xs:inline">coins</span>
                  </Badge>
                </motion.div>
              )}
              <ThemeToggle />
              <motion.div whileHover={{ scale: 1.1 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setLocation("/leaderboard")}
                  className="rounded-2xl border-2 border-yellow-500/30 hover:bg-yellow-500/10"
                  data-testid="button-leaderboard"
                  title="Leaderboard"
                >
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSignOut}
                  className="rounded-2xl border-2 border-destructive/30 hover:bg-destructive/10"
                  data-testid="button-signout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-4 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <div className="md:hidden flex items-center gap-2 mb-4 px-1">
              {parentSettings && (
                <Badge className="px-3 py-1.5 text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 font-semibold border-2 border-yellow-400 dark:border-yellow-700" data-testid="badge-coin-balance">
                  <Coins className="w-4 h-4 mr-1.5" />
                  <span>{parentSettings.coins}</span>
                  <span className="ml-1">coins</span>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="rounded-xl ml-auto"
                data-testid="button-signout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <Card className="md:hidden rounded-2xl mb-4 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={() => {
                    setEditingStory(null);
                    setShowAddStory(true);
                    setAudioUrl(null);
                    setIsRecording(false);
                    form.reset({
                      title: "",
                      content: "",
                      summary: "",
                      imageUrl: teddyImage,
                      language: "english" as const,
                      category: "educational" as const,
                      storyType: "lesson" as const,
                      voiceoverUrl: undefined,
                    });
                  }}
                  className="w-full rounded-xl"
                  data-testid="button-add-story"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Story for Review
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/checkpoints")}
                    className="rounded-xl"
                    data-testid="button-checkpoints"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Checkpoints
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/pricing")}
                    className="rounded-xl"
                    data-testid="button-view-plans"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Plans
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/child-mode")}
                    className="rounded-xl col-span-2"
                    data-testid="button-child-mode"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Child Mode
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="hidden md:flex gap-3 flex-wrap w-full">
              <motion.div whileHover={{ scale: 1.05 }} className="flex-1 sm:flex-initial">
                <Button
                  onClick={() => {
                    setEditingStory(null);
                    setShowAddStory(true);
                    setAudioUrl(null);
                    setIsRecording(false);
                    form.reset({
                      title: "",
                      content: "",
                      summary: "",
                      imageUrl: teddyImage,
                      language: "english" as const,
                      category: "educational" as const,
                      storyType: "lesson" as const,
                      voiceoverUrl: undefined,
                    });
                  }}
                  className="rounded-2xl text-sm sm:text-base w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all font-bold"
                  data-testid="button-add-story-desktop"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Story for Review
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/checkpoints")}
                  className="rounded-2xl text-sm sm:text-base w-full border-2 border-primary/40 font-semibold"
                  data-testid="button-checkpoints-desktop"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Checkpoints & Rewards
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/pricing")}
                  className="rounded-2xl text-sm sm:text-base w-full border-2 border-secondary/40 font-semibold"
                  data-testid="button-view-plans-desktop"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  View Plans
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex-1 sm:flex-initial">
                <Button
                  onClick={() => setLocation("/child-mode")}
                  className="rounded-2xl text-sm sm:text-base w-full bg-gradient-to-r from-secondary to-accent hover:shadow-xl transition-all font-bold"
                  data-testid="button-child-mode-desktop"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Enter Child Mode
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <TrialBanner />

          <Tabs defaultValue="published" className="space-y-6 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <TabsList className="w-full sm:w-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-1 shadow-lg" data-testid="tabs-parent-dashboard">
                <TabsTrigger value="published" className="flex-1 sm:flex-initial text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white" data-testid="tab-published">
                  Published Stories
                </TabsTrigger>
                <TabsTrigger value="yours" className="flex-1 sm:flex-initial text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white" data-testid="tab-your-stories">
                  Your Stories
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 sm:flex-initial text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white" data-testid="tab-settings">
                  <SettingsIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="published">
              <motion.div className="mb-6 space-y-4">
                <motion.div className="flex gap-3 flex-wrap">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button
                      variant={filterBookmarked ? "default" : "outline"}
                      onClick={() => setFilterBookmarked(!filterBookmarked)}
                      className={`rounded-2xl font-bold border-2 ${filterBookmarked ? "bg-gradient-to-r from-primary to-secondary" : "border-primary/40"}`}
                      data-testid="button-filter-bookmarks"
                    >
                      <BookmarkCheck className="w-5 h-5 mr-2" />
                      {filterBookmarked ? "Show All" : "Bookmarked Only"}
                    </Button>
                  </motion.div>
                </motion.div>
                
                <div className="flex gap-3 flex-wrap">
                  <motion.div className="relative flex-1 min-w-[200px]" whileHover={{ scale: 1.02 }}>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      placeholder="🔍 Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-2xl pl-12 border-2 border-primary/30 font-semibold focus:border-primary focus:shadow-lg"
                      data-testid="input-search-stories"
                    />
                  </motion.div>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="rounded-2xl w-[180px] border-2 border-primary/30 font-semibold" data-testid="select-language-filter">
                      <SelectValue placeholder="Filter by language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="malayalam">Malayalam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="rounded-2xl w-[180px] border-2 border-secondary/30 font-semibold" data-testid="select-category-filter">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="islamic">Islamic</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="moral">Moral Lessons</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="fairy-tale">Fairy Tale</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={storyTypeFilter} onValueChange={setStoryTypeFilter}>
                    <SelectTrigger className="rounded-2xl w-[180px] border-2 border-accent/30 font-semibold" data-testid="select-story-type-filter">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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
                </div>
              </motion.div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading stories...</p>
                </div>
              ) : displayedStories.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 text-center py-16 shadow-lg">
                    <CardContent className="pt-8">
                      <p className="text-xl font-semibold text-foreground">
                        {filterBookmarked ? "No bookmarked stories yet" : "No published stories yet"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayedStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onRead={(story) => {
                        // Smart routing based on audience
                        if (story.audience === "parent") {
                          // Parent-only stories go directly to read page
                          setLocation(`/read-story?story=${story.id}`);
                        } else {
                          // Child or both stories go to child mode
                          setLocation(`/child-mode?story=${story.id}`);
                        }
                      }}
                      onToggleBookmark={(story) => toggleBookmarkMutation.mutate(story.id)}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="yours">
              {loadingSubmissions ? (
                <div className="text-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-4" />
                  </motion.div>
                  <p className="text-muted-foreground font-semibold">Loading your stories...</p>
                </div>
              ) : mySubmissions.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 text-center py-16 shadow-lg">
                    <CardContent className="pt-8">
                      <p className="text-xl font-semibold text-foreground mb-6">
                        You haven't submitted any stories yet
                      </p>
                      <Button onClick={() => setShowAddStory(true)} className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg font-bold">
                        <Plus className="w-5 h-5 mr-2" />
                        Submit Your First Story
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {mySubmissions.map((story) => (
                    <Card key={story.id} className="rounded-3xl" data-testid={`card-story-${story.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{story.title}</CardTitle>
                          <CardDescription className="mt-1">{story.summary}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(story)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(story.createdAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {story.status === "draft" && story.rejectionReason && (
                          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{story.rejectionReason}</p>
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {story.status === "draft" && (
                            <>
                              <Button
                                onClick={() => handleEditStory(story)}
                                className="rounded-2xl"
                                data-testid={`button-edit-${story.id}`}
                              >
                                Edit Draft
                              </Button>
                              <Button
                                onClick={() => submitStoryMutation.mutate(story.id)}
                                disabled={submitStoryMutation.isPending}
                                className="rounded-2xl"
                                data-testid={`button-submit-${story.id}`}
                              >
                                Submit for Review
                              </Button>
                            </>
                          )}
                          {story.status === "pending_review" && (
                            <p className="text-sm text-muted-foreground italic">
                              Your story is being reviewed by an admin
                            </p>
                          )}
                          {story.status === "published" && (
                            <Button
                              onClick={() => {
                                // Smart routing based on audience
                                if (story.audience === "parent") {
                                  setLocation(`/read-story?story=${story.id}`);
                                } else {
                                  setLocation(`/child-mode?story=${story.id}`);
                                }
                              }}
                              className="rounded-2xl"
                              data-testid={`button-read-${story.id}`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Read Story
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings">
              <Card className="rounded-3xl" data-testid="card-settings">
                <CardHeader>
                  <CardTitle className="text-2xl">Account Settings</CardTitle>
                  <CardDescription>Manage your account and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {parentSettings ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Current Coins Balance</p>
                        <p className="text-3xl font-bold text-primary flex items-center gap-2">
                          <Coins className="w-6 h-6" />
                          {parentSettings.coins}
                        </p>
                      </div>
                      <Button 
                        onClick={() => setLocation("/pricing")}
                        className="rounded-2xl w-full"
                        data-testid="button-buy-coins-settings"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy More Coins
                      </Button>
                      <div className="border-t pt-6">
                        <Button
                          onClick={() => setShowEditPin(true)}
                          variant="outline"
                          className="rounded-2xl w-full"
                          data-testid="button-edit-child-lock"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Edit Child Lock PIN
                        </Button>
                      </div>
                      <div className="border-t pt-6">
                        <p className="text-sm text-muted-foreground">
                          Your subscription details and preferences appear here. For more options, visit the Plans page.
                        </p>
                      </div>
                      <Button 
                        onClick={async () => {
                          await signOut();
                          setLocation("/");
                          toast({
                            title: "Signed out",
                            description: "You have been signed out successfully",
                            duration: 2000,
                          });
                        }}
                        variant="destructive"
                        className="rounded-2xl w-full"
                        data-testid="button-sign-out-settings"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading settings...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={showAddStory || !!editingStory} onOpenChange={(open) => {
        if (!open) {
          setShowAddStory(false);
          setEditingStory(null);
          setAudioUrl(null);
          setVoiceoverBase64(null);
          setIsRecording(false);
          form.reset({
            title: "",
            content: "",
            summary: "",
            imageUrl: teddyImage,
            language: "english" as const,
            category: "educational" as const,
            storyType: "lesson" as const,
            audience: "both" as const,
            pdfUrl: "",
            audioUrl: "",
            voiceoverUrl: undefined,
          });
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-story">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingStory ? "Edit Draft Story" : "Submit Story for Review"}
            </DialogTitle>
            <DialogDescription>
              {editingStory 
                ? "Make changes to your draft story"
                : "Create a magical bedtime story. It will be reviewed by an admin before publishing."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="The Magical Adventure" className="rounded-2xl" {...field} data-testid="input-story-title" />
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
                      <Input placeholder="A brief description of the story" className="rounded-2xl" {...field} data-testid="input-story-summary" />
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
                        <SelectTrigger className="rounded-2xl" data-testid="select-story-language">
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
                    <FormLabel>Story Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl" data-testid="select-story-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="islamic">Islamic</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="moral">Moral Lessons</SelectItem>
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
                        <SelectTrigger className="rounded-2xl" data-testid="select-parent-story-type">
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
                        <SelectTrigger className="rounded-2xl" data-testid="select-story-audience">
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
                    <FormLabel>PDF Document (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          ref={pdfInputRef}
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                          data-testid="input-pdf-file"
                        />
                        
                        {!pdfFile && (
                          <Button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            variant="outline"
                            className="rounded-2xl w-full"
                            data-testid="button-upload-pdf"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload PDF Document
                          </Button>
                        )}
                        
                        {pdfFile && (
                          <div className="p-4 border-2 rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">{pdfFile.name}</p>
                                  <p className="text-xs text-green-600 dark:text-green-400">PDF ready</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={deletePdfFile}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl flex-shrink-0"
                                data-testid="button-delete-pdf"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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
                    <FormLabel>Audio Narration (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioFileUpload}
                          className="hidden"
                          data-testid="input-audio-file"
                        />
                        
                        {!audioFile && (
                          <Button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            variant="outline"
                            className="rounded-2xl w-full"
                            data-testid="button-upload-audio"
                          >
                            <FileAudio className="w-4 h-4 mr-2" />
                            Upload Audio Narration
                          </Button>
                        )}
                        
                        {audioFile && (
                          <div className="p-4 border-2 rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">{audioFile.name}</p>
                                  <p className="text-xs text-green-600 dark:text-green-400">Audio ready</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={deleteAudioFile}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl flex-shrink-0"
                                data-testid="button-delete-audio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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
                        data-testid="input-story-content"
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
                    <FormLabel>Voice Recording (Optional for Draft, Required for Review)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {!audioUrl && !isRecording && (
                          <Button
                            type="button"
                            onClick={startRecording}
                            variant="outline"
                            className="rounded-2xl w-full"
                            data-testid="button-start-recording"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording Voiceover
                          </Button>
                        )}
                        
                        {isRecording && (
                          <div className="p-4 border-2 border-primary rounded-2xl bg-primary/5">
                            <div className="flex items-center justify-between">
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
                                data-testid="button-stop-recording"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Stop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {audioUrl && !isRecording && (
                          <div className="p-4 border-2 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
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
                                data-testid="button-delete-recording"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <audio src={audioUrl} controls className="w-full" data-testid="audio-player" />
                            <p className="text-xs text-muted-foreground">
                              Required: Your voiceover will be played when children read this story
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Image</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        {imageOptions.map((option) => (
                          <button
                            key={option.url}
                            type="button"
                            onClick={() => field.onChange(option.url)}
                            className={`relative rounded-2xl overflow-hidden border-4 transition-all ${
                              field.value === option.url ? "border-primary" : "border-transparent"
                            }`}
                            data-testid={`button-image-${option.label.toLowerCase()}`}
                          >
                            <img src={option.url} alt={option.label} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit((data) => handleFormSubmit(data, true))}
                  className="rounded-2xl" 
                  data-testid="button-create-draft"
                  disabled={pdfUploading || audioUploading}
                >
                  {(pdfUploading || audioUploading) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      {editingStory ? "Save Draft" : "Create Draft"}
                    </>
                  )}
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-2xl" 
                  data-testid="button-submit-story"
                  disabled={pdfUploading || audioUploading}
                >
                  {(pdfUploading || audioUploading) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditPin} onOpenChange={setShowEditPin}>
        <DialogContent className="sm:max-w-md rounded-3xl" data-testid="dialog-edit-pin">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="font-heading text-2xl text-center">Edit Child Lock PIN</DialogTitle>
            <DialogDescription className="text-center">
              Change your 4-digit parental control PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter current PIN"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest rounded-2xl"
                data-testid="input-current-pin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter new PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest rounded-2xl"
                data-testid="input-new-pin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Confirm new PIN"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest rounded-2xl"
                data-testid="input-confirm-new-pin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditPin(false);
                setOldPin("");
                setNewPin("");
                setConfirmNewPin("");
              }}
              className="rounded-2xl"
              data-testid="button-cancel-edit-pin"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePin}
              disabled={updatePinMutation.isPending}
              className="rounded-2xl"
              data-testid="button-save-new-pin"
            >
              {updatePinMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update PIN"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
}
