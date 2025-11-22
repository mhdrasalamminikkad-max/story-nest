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
import { Plus, Play, LogOut, BookmarkCheck, Clock, CheckCircle, XCircle, FileText, Mic, Square, Trash2, Volume2, CreditCard, Coins, Search, Target, Home, BookOpen, Upload, FileAudio } from "lucide-react";
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

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddStory, setShowAddStory] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storyTypeFilter, setStoryTypeFilter] = useState<string>("all");
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceoverBase64, setVoiceoverBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // File upload states
  const [pdfFile, setPdfFile] = useState<{ name: string; data: string } | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<{ name: string; data: string } | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
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

  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

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

  const handleSignOut = () => {
    fakeAuth.signOut();
    setLocation("/");
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
          console.error("Error uploading voiceover:", error);
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
      console.error("Error accessing microphone:", error);
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

    setPdfUploading(true);
    setPdfProgress(0);

    try {
      const userId = user?.uid || `temp-${Date.now()}`;
      const downloadURL = await uploadPDFFile(file, userId, (progress) => {
        // Only update progress if still uploading
        setPdfProgress(Math.min(progress, 99));
      });

      setPdfFile({ name: file.name, data: downloadURL });
      (form.setValue as any)('pdfUrl', downloadURL);
      // Clear uploading state first to hide progress bar immediately
      setPdfUploading(false);
      setTimeout(() => setPdfProgress(0), 100);
      toast({
        title: "PDF uploaded",
        description: `${file.name} uploaded successfully`,
        duration: 4000,
      });
    } catch (error) {
      setPdfUploading(false);
      setTimeout(() => setPdfProgress(0), 50);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF file",
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

    setAudioUploading(true);
    setAudioProgress(0);

    try {
      const userId = user?.uid || `temp-${Date.now()}`;
      const downloadURL = await uploadAudioFile(file, userId, (progress) => {
        // Only update progress if still uploading
        setAudioProgress(Math.min(progress, 99));
      });

      setAudioFile({ name: file.name, data: downloadURL });
      (form.setValue as any)('audioUrl', downloadURL);
      // Clear uploading state first to hide progress bar immediately
      setAudioUploading(false);
      setTimeout(() => setAudioProgress(0), 100);
      toast({
        title: "Audio uploaded",
        description: `${file.name} uploaded successfully`,
        duration: 4000,
      });
    } catch (error) {
      setAudioUploading(false);
      setTimeout(() => setAudioProgress(0), 50);
      toast({
        title: "Upload failed",
        description: "Failed to upload audio file",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const deletePdfFile = () => {
    setPdfFile(null);
    setPdfProgress(0);
    (form.setValue as any)('pdfUrl', '');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const deleteAudioFile = () => {
    setAudioFile(null);
    setAudioProgress(0);
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
      setPdfProgress(100);
    } else {
      setPdfFile(null);
      setPdfProgress(0);
    }
    
    if (story.audioUrl) {
      setAudioFile({ name: "Existing Audio", data: story.audioUrl });
      setAudioProgress(100);
    } else {
      setAudioFile(null);
      setAudioProgress(0);
    }
    
    form.reset({
      title: story.title,
      content: story.content,
      summary: story.summary,
      imageUrl: story.imageUrl,
      language: story.language,
      category: story.category,
      storyType: story.storyType,
      audience: story.audience,
      pdfUrl: story.pdfUrl || "",
      audioUrl: story.audioUrl || "",
      ...(story.voiceoverUrl && { voiceoverUrl: story.voiceoverUrl }),
    });
  };

  const handleFormSubmit = (data: any) => {
    // Use voiceoverBase64 state to ensure we have the latest recording
    // even if FileReader.onloadend hasn't completed yet
    const submissionData = {
      ...data,
      voiceoverUrl: voiceoverBase64 || data.voiceoverUrl,
    };
    
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
        
        <header className="hidden md:block border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-xl transition-all"
                onClick={() => setLocation("/")}
                data-testid="button-home-logo"
              >
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h1 className="font-heading text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  StoryNest
                </h1>
              </div>
              <div className="h-6 w-px bg-border" />
              <h2 className="font-heading text-lg sm:text-xl text-foreground">Parent Dashboard</h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {parentSettings && (
                <Badge variant="secondary" className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm" data-testid="badge-coin-balance">
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  <span className="font-semibold">{parentSettings.coins}</span>
                  <span className="ml-0.5 sm:ml-1 text-muted-foreground hidden xs:inline">coins</span>
                </Badge>
              )}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-2xl"
                data-testid="button-signout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
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
                <Badge variant="secondary" className="px-3 py-1.5 text-sm" data-testid="badge-coin-balance">
                  <Coins className="w-4 h-4 mr-1.5" />
                  <span className="font-semibold">{parentSettings.coins}</span>
                  <span className="ml-1 text-muted-foreground">coins</span>
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

            <div className="hidden md:flex gap-2 flex-wrap w-full">
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
                className="rounded-2xl text-sm sm:text-base flex-1 sm:flex-initial"
                data-testid="button-add-story-desktop"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Story for Review
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/checkpoints")}
                className="rounded-2xl text-sm sm:text-base flex-1 sm:flex-initial"
                data-testid="button-checkpoints-desktop"
              >
                <Target className="w-4 h-4 mr-2" />
                Checkpoints & Rewards
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/pricing")}
                className="rounded-2xl text-sm sm:text-base flex-1 sm:flex-initial"
                data-testid="button-view-plans-desktop"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                View Plans
              </Button>
              <Button
                onClick={() => setLocation("/child-mode")}
                className="rounded-2xl text-sm sm:text-base flex-1 sm:flex-initial"
                data-testid="button-child-mode-desktop"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Enter Child Mode
              </Button>
            </div>
          </motion.div>

          <TrialBanner />

          <Tabs defaultValue="published" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full sm:w-auto" data-testid="tabs-parent-dashboard">
              <TabsTrigger value="published" className="flex-1 sm:flex-initial text-xs sm:text-sm" data-testid="tab-published">
                Published Stories
              </TabsTrigger>
              <TabsTrigger value="yours" className="flex-1 sm:flex-initial text-xs sm:text-sm" data-testid="tab-your-stories">
                Your Stories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published">
              <div className="mb-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filterBookmarked ? "default" : "outline"}
                    onClick={() => setFilterBookmarked(!filterBookmarked)}
                    className="rounded-2xl"
                    data-testid="button-filter-bookmarks"
                  >
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    {filterBookmarked ? "Show All" : "Bookmarked Only"}
                  </Button>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-2xl pl-10"
                      data-testid="input-search-stories"
                    />
                  </div>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="rounded-2xl w-[180px]" data-testid="select-language-filter">
                      <SelectValue placeholder="Filter by language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="malayalam">Malayalam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="rounded-2xl w-[180px]" data-testid="select-category-filter">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectTrigger className="rounded-2xl w-[180px]" data-testid="select-story-type-filter">
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
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading stories...</p>
                </div>
              ) : displayedStories.length === 0 ? (
                <Card className="rounded-3xl border-2 text-center py-12">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      {filterBookmarked ? "No bookmarked stories yet" : "No published stories yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onRead={(story) => setLocation(`/child-mode?story=${story.id}`)}
                      onToggleBookmark={(story) => toggleBookmarkMutation.mutate(story.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="yours">
              {loadingSubmissions ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading your stories...</p>
                </div>
              ) : mySubmissions.length === 0 ? (
                <Card className="rounded-3xl border-2 text-center py-12">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      You haven't submitted any stories yet
                    </p>
                    <Button onClick={() => setShowAddStory(true)} className="rounded-2xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Your First Story
                    </Button>
                  </CardContent>
                </Card>
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
                              onClick={() => setLocation(`/child-mode?story=${story.id}`)}
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
                        
                        {!pdfFile && !pdfUploading && (
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
                        
                        {pdfUploading && (
                          <div className="p-4 border-2 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Uploading PDF...</span>
                              <span className="text-sm text-muted-foreground">{Math.round(pdfProgress)}%</span>
                            </div>
                            <Progress value={pdfProgress} className="h-2" />
                          </div>
                        )}
                        
                        {pdfFile && !pdfUploading && (
                          <div className="p-4 border-2 rounded-2xl space-y-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium truncate">{pdfFile.name}</span>
                              </div>
                              <Button
                                type="button"
                                onClick={deletePdfFile}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-delete-pdf"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              PDF uploaded successfully
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
                        
                        {!audioFile && !audioUploading && (
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
                        
                        {audioUploading && (
                          <div className="p-4 border-2 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Uploading Audio...</span>
                              <span className="text-sm text-muted-foreground">{Math.round(audioProgress)}%</span>
                            </div>
                            <Progress value={audioProgress} className="h-2" />
                          </div>
                        )}
                        
                        {audioFile && !audioUploading && (
                          <div className="p-4 border-2 rounded-2xl space-y-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium truncate">{audioFile.name}</span>
                              </div>
                              <Button
                                type="button"
                                onClick={deleteAudioFile}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-delete-audio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <audio src={audioFile.data} controls className="w-full" data-testid="audio-preview" />
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Audio uploaded successfully
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
                    <FormLabel>Voice Recording (Required) *</FormLabel>
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

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="rounded-2xl" 
                  disabled={addStoryMutation.isPending || updateStoryMutation.isPending} 
                  data-testid="button-submit-story"
                >
                  {editingStory 
                    ? (updateStoryMutation.isPending ? "Saving..." : "Save Draft")
                    : (addStoryMutation.isPending ? "Creating..." : "Create Draft")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
}
