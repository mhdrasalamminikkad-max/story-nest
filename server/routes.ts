import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticateUser, checkNotBlocked, type AuthRequest } from "./middleware/auth";
import { requireAdmin } from "./middleware/adminAuth";
import { getSubscriptionInfo, checkSubscriptionStatus, type SubscriptionRequest } from "./middleware/subscription";
import { insertStorySchema, insertParentSettingsSchema, insertBookmarkSchema, reviewStorySchema, insertSubscriptionPlanSchema, updateSubscriptionPlanSchema, updateCoinSettingsSchema, updatePlanCoinCostSchema, insertCoinPackageSchema, updateCoinPackageSchema, insertCheckpointSchema, insertReadingSessionSchema, insertStoryCategorySchema, insertStoryTypeSchema } from "@shared/schema";
import type { Story, ParentSettings, Bookmark, SubscriptionPlan } from "@shared/schema";
import { hashPIN, verifyPIN } from "./utils/crypto";
import { db } from "./db";
import { stories, parentSettings, bookmarks, subscriptionPlans, coinSettings, planCoinCosts, userSubscriptions, coinPackages, processedPayments, checkpoints, checkpointProgress, readingSessions, badges, gameSessions, storyCategories, storyTypes } from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import Razorpay from "razorpay";
import crypto from "crypto";
import { initializeWebSocket, wsManager } from "./websocket";
import { verifyIdToken, setUserClaims } from "./lib/firebase-admin-auth";

// Helper function to filter out blob URLs and only allow Firebase storage URLs
function filterBlobUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('blob:')) return undefined;
  return url;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Verify Firebase ID Token endpoint
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "No token provided" });
      }
      
      // Verify the Firebase ID token
      const decodedToken = await verifyIdToken(token);
      const userId = decodedToken.uid;
      
      // Check if user exists in parentSettings
      const [existingUser] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));
      
      // If user doesn't exist, create them with default settings
      if (!existingUser) {
        const now = new Date();
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        
        await db.insert(parentSettings).values({
          userId: userId,
          pinHash: "", // Empty PIN initially
          readingTimeLimit: 30, // Default 30 minutes
          fullscreenLockEnabled: false,
          theme: "system", // Default theme
          coins: 0, // Start with 0 coins
          subscriptionStatus: "trial", // Default to trial
          trialStartedAt: now,
          trialEndsAt: trialEndsAt, // 7 days free trial
        });
      }

      // Set HTTP-only cookie with ID token for web
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true, // Only send over HTTPS
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      // Return user info
      res.json({
        success: true,
        user: {
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
        },
      });
    } catch (error: any) {
      console.error("Token verification error:", error);
      res.status(401).json({ error: "Token verification failed" });
    }
  });

  // Check if user has active session
  app.get("/api/auth/me", async (req, res) => {
    try {
      // First check for HTTP-only cookie (web apps)
      let token = req.cookies?.auth_token;
      
      // Fallback to Authorization header (mobile apps)
      if (!token) {
        const authHeader = req.headers.authorization;
        token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      }
      
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Verify Firebase ID token
      const decodedToken = await verifyIdToken(token);
      
      // Return user info
      res.json({
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      });
    } catch (error: any) {
      console.error("Auth check error:", error);
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Sign out endpoint
  app.post("/api/auth/logout", async (req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });

  // Debug endpoint for token verification
  app.post("/api/auth/test-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "No token provided" });
      }
      
      console.log("🧪 Testing token verification...");
      console.log("Token length:", token.length);
      console.log("Token preview:", token.substring(0, 50) + "...");
      
      const decodedToken = await verifyIdToken(token);
      console.log("✅ Token verified:", decodedToken.uid);
      
      res.json({
        success: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
        message: "Token is valid"
      });
    } catch (error: any) {
      console.error("❌ Token verification failed:", error.message);
      res.status(401).json({
        error: "Token verification failed",
        details: error.message,
        code: error.code
      });
    }
  });

  // Stories endpoints - Public feed (published stories only) - requires valid subscription
  // Get published stories - public endpoint
  app.get("/api/stories", async (req, res) => {
    try {
      const { storyType, category, language } = req.query;
      
      let query = db.select({
        id: stories.id,
        userId: stories.userId,
        title: stories.title,
        content: stories.content,
        imageUrl: stories.imageUrl,
        summary: stories.summary,
        audience: stories.audience,
        language: stories.language,
        category: stories.category,
        storyType: stories.storyType,
        status: stories.status,
        approvedBy: stories.approvedBy,
        rejectionReason: stories.rejectionReason,
        createdAt: stories.createdAt,
        reviewedAt: stories.reviewedAt,
      }).from(stories);
      const conditions = [eq(stories.status, "published")];
      
      if (storyType && typeof storyType === 'string') {
        conditions.push(eq(stories.storyType, storyType));
      }
      
      if (category && typeof category === 'string') {
        conditions.push(eq(stories.category, category));
      }
      
      if (language && typeof language === 'string') {
        conditions.push(eq(stories.language, language));
      }
      
      const publishedStories = await query
        .where(and(...conditions))
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = publishedStories.map(s => ({
        ...s,
        createdAt: s.createdAt instanceof Date ? s.createdAt.getTime() : s.createdAt,
        reviewedAt: s.reviewedAt instanceof Date ? s.reviewedAt.getTime() : null,
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  // Get user's own story submissions (all statuses)
  app.get("/api/stories/my-submissions", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userStories = await db
        .select({
          id: stories.id,
          userId: stories.userId,
          title: stories.title,
          content: stories.content,
          imageUrl: stories.imageUrl,
          summary: stories.summary,
          audience: stories.audience,
          language: stories.language,
          category: stories.category,
          storyType: stories.storyType,
          status: stories.status,
          approvedBy: stories.approvedBy,
          rejectionReason: stories.rejectionReason,
          createdAt: stories.createdAt,
          reviewedAt: stories.reviewedAt,
        })
        .from(stories)
        .where(eq(stories.userId, userId))
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = userStories.map(s => ({
        ...s,
        createdAt: s.createdAt instanceof Date ? s.createdAt.getTime() : s.createdAt,
        reviewedAt: s.reviewedAt instanceof Date ? s.reviewedAt.getTime() : null,
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ error: "Failed to fetch your stories" });
    }
  });

  app.get("/api/stories/preview", async (req, res) => {
    try {
      const previewStories = await db
        .select({
          id: stories.id,
          userId: stories.userId,
          title: stories.title,
          content: stories.content,
          imageUrl: stories.imageUrl,
          summary: stories.summary,
          audience: stories.audience,
          language: stories.language,
          category: stories.category,
          storyType: stories.storyType,
          status: stories.status,
          approvedBy: stories.approvedBy,
          rejectionReason: stories.rejectionReason,
          createdAt: stories.createdAt,
          reviewedAt: stories.reviewedAt,
        })
        .from(stories)
        .where(eq(stories.status, "published"))
        .orderBy(desc(stories.createdAt));
      
      // Fetch creator admin status for each story
      const storiesWithCreatorInfo = await Promise.all(
        previewStories.map(async (s) => {
          const [creator] = await db
            .select({ isAdmin: parentSettings.isAdmin })
            .from(parentSettings)
            .where(eq(parentSettings.userId, s.userId));
          
          return {
            ...s,
            createdAt: s.createdAt instanceof Date ? s.createdAt.getTime() : s.createdAt,
            isCreatorAdmin: creator?.isAdmin || false,
          };
        })
      );
      
      res.json(storiesWithCreatorInfo);
    } catch (error) {
      console.error("Error fetching preview stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  // Get single story by ID - public endpoint for published stories
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [story] = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, id), eq(stories.status, "published")));
      
      if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
      }
      
      const storyWithTimestamp = {
        ...story,
        createdAt: story.createdAt instanceof Date ? story.createdAt.getTime() : story.createdAt,
        reviewedAt: story.reviewedAt instanceof Date ? story.reviewedAt.getTime() : null,
      };
      
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  // Create new story (all stories require admin approval)
  app.post("/api/stories", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storyData = insertStorySchema.parse(req.body);

      // Filter out blob URLs - only allow Firebase storage URLs
      const sanitizedData = {
        ...storyData,
        pdfUrl: filterBlobUrl(storyData.pdfUrl),
        audioUrl: filterBlobUrl(storyData.audioUrl),
        voiceoverUrl: filterBlobUrl(storyData.voiceoverUrl),
      };

      const [story] = await db
        .insert(stories)
        .values({
          id: `story-${Date.now()}`,
          ...sanitizedData,
          userId,
          status: "pending_review",
          approvedBy: null,
          reviewedAt: null,
        })
        .returning();
      
      const storyWithTimestamp = {
        ...story,
        createdAt: story.createdAt instanceof Date ? story.createdAt.getTime() : story.createdAt,
        reviewedAt: story.reviewedAt instanceof Date ? story.reviewedAt.getTime() : null,
      };
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Submit draft story for review
  app.post("/api/stories/:id/submit", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Verify ownership and story is in draft status
      const [story] = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, id), eq(stories.userId, userId)));

      if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
      }

      if (story.status !== "draft") {
        res.status(400).json({ error: "Only draft stories can be submitted for review" });
        return;
      }

      const [updatedStory] = await db
        .update(stories)
        .set({ status: "pending_review" })
        .where(eq(stories.id, id))
        .returning();

      const storyWithTimestamp = {
        ...updatedStory,
        createdAt: updatedStory.createdAt.getTime(),
        reviewedAt: updatedStory.reviewedAt?.getTime() || null,
      };
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error submitting story:", error);
      res.status(500).json({ error: "Failed to submit story for review" });
    }
  });

  // Edit story (draft or pending review)
  app.patch("/api/stories/:id", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const updates = insertStorySchema.parse(req.body);

      // Verify ownership and story is editable (draft or pending review)
      const [story] = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, id), eq(stories.userId, userId)));

      if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
      }

      if (story.status !== "draft" && story.status !== "pending_review") {
        res.status(400).json({ error: "Only draft or pending review stories can be edited" });
        return;
      }

      const [updatedStory] = await db
        .update(stories)
        .set({
          title: updates.title,
          content: updates.content,
          imageUrl: updates.imageUrl,
          summary: updates.summary,
          language: updates.language,
          category: updates.category,
          storyType: updates.storyType,
          audience: updates.audience,
          pdfUrl: filterBlobUrl(updates.pdfUrl),
          audioUrl: filterBlobUrl(updates.audioUrl),
          voiceoverUrl: filterBlobUrl(updates.voiceoverUrl),
        })
        .where(eq(stories.id, id))
        .returning();

      const storyWithTimestamp = {
        ...updatedStory,
        createdAt: updatedStory.createdAt.getTime(),
        reviewedAt: updatedStory.reviewedAt?.getTime() || null,
      };
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ error: "Failed to update story" });
    }
  });

  // Parent settings endpoints
  app.get("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        // Return 404 when user hasn't set up yet - this tells frontend to redirect to /setup
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/parent-settings", async (req: AuthRequest, res) => {
    try {
      // Get userId from auth context or body
      let userId = req.userId;
      
      // If not authenticated, extract from request body or headers
      if (!userId && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (token && auth) {
          try {
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
          } catch (error) {
            console.log("Token verification skipped - proceeding without auth");
          }
        }
      }
      
      // If still no userId, generate a temp one for demo/testing
      if (!userId) {
        userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log("⚠️ No authentication - using temp userId:", userId);
      }
      
      // Validate input
      let settingsData;
      try {
        settingsData = insertParentSettingsSchema.parse(req.body);
      } catch (validationError: any) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ 
          error: "Validation error",
          details: validationError.errors || validationError.message 
        });
      }
      
      const pinHash = hashPIN(settingsData.pin);

      // Check if this is the first user (make them admin automatically)
      const existingUsers = await db.select().from(parentSettings);
      const isFirstUser = existingUsers.length === 0;

      // Save settings without trial dates to avoid serialization issues
      const [settings] = await db
        .insert(parentSettings)
        .values({
          userId,
          pinHash,
          parentName: settingsData.parentName,
          childName: settingsData.childName,
          childAge: settingsData.childAge,
          readingTimeLimit: settingsData.readingTimeLimit,
          fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
          theme: settingsData.theme,
          isAdmin: isFirstUser,
          subscriptionStatus: "trial",
        })
        .onConflictDoUpdate({
          target: parentSettings.userId,
          set: {
            pinHash,
            parentName: settingsData.parentName,
            childName: settingsData.childName,
            childAge: settingsData.childAge,
            readingTimeLimit: settingsData.readingTimeLimit,
            fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
            theme: settingsData.theme,

            // Trial fields are NOT updated on settings update - only set on first creation
          },
        })
        .returning();

      res.json(settings);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      res.status(500).json({ 
        error: "Failed to save settings",
        message: error.message || "Unknown error"
      });
    }
  });

  // Add coins to user's own account
  app.post("/api/add-coins", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        res.status(400).json({ error: "amount must be a positive number" });
        return;
      }

      const [settings] = await db
        .select({ coins: parentSettings.coins })
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      const newCoins = (settings.coins ?? 0) + amount;

      const [updated] = await db
        .update(parentSettings)
        .set({ coins: newCoins })
        .where(eq(parentSettings.userId, userId))
        .returning();

      res.json({ success: true, coinsAdded: amount, totalCoins: updated.coins });
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(500).json({ error: "Failed to add coins" });
    }
  });

  app.post("/api/verify-pin", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { pin } = req.body;

      if (!pin || pin.length !== 4) {
        res.status(400).json({ valid: false, error: "Invalid PIN format" });
        return;
      }

      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        res.status(404).json({ valid: false, error: "Settings not found" });
        return;
      }

      const isValid = verifyPIN(pin, settings.pinHash);
      
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Bookmarks endpoints
  app.get("/api/bookmarks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userBookmarks = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));
      
      const storyIds: string[] = userBookmarks.map(b => b.storyId);
      res.json(storyIds);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const bookmarkData = insertBookmarkSchema.parse(req.body);

      await db
        .insert(bookmarks)
        .values({
          id: `bookmark-${Date.now()}`,
          userId,
          storyId: bookmarkData.storyId,
        });

      res.json({ success: true });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ error: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:storyId", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { storyId } = req.params;

      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.storyId, storyId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Admin check endpoint - public endpoint, returns false if no userId
  app.get("/api/admin/check", async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      
      // Return false if not authenticated
      if (!userId) {
        return res.json({ isAdmin: false });
      }
      
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      res.json({ isAdmin: settings?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.json({ isAdmin: false });
    }
  });

  // Promote user to admin using secret code
  app.post("/api/admin/promote", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { code } = req.body;

      if (code !== "786786") {
        return res.status(403).json({ error: "Invalid admin code" });
      }

      const [updated] = await db
        .update(parentSettings)
        .set({ isAdmin: true })
        .where(eq(parentSettings.userId, userId))
        .returning();

      console.log(`User ${userId} promoted to admin via secret code`);
      res.json({ success: true, isAdmin: updated.isAdmin });
    } catch (error) {
      console.error("Error promoting to admin:", error);
      res.status(500).json({ error: "Failed to promote to admin" });
    }
  });

  // Grant admin access with secret code (legacy endpoint for compatibility)
  app.post("/api/admin/grant", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { code } = req.body;
      
      // Secret code for granting admin access
      const ADMIN_SECRET_CODE = "786786";
      
      if (code !== ADMIN_SECRET_CODE) {
        res.status(403).json({ error: "Invalid admin code" });
        return;
      }

      // Grant admin access
      await db
        .update(parentSettings)
        .set({ isAdmin: true })
        .where(eq(parentSettings.userId, userId));

      res.json({ success: true, message: "Admin access granted!" });
    } catch (error) {
      console.error("Error granting admin access:", error);
      res.status(500).json({ error: "Failed to grant admin access" });
    }
  });

  // Update parent settings
  app.patch("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const updates = req.body;

      // Only allow updating specific fields
      const allowedFields = ["childName", "childAge", "readingTimeLimit", "theme", "fullscreenLockEnabled"];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (field in updates) {
          updateData[field] = updates[field];
        }
      }

      const [updated] = await db
        .update(parentSettings)
        .set(updateData)
        .where(eq(parentSettings.userId, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating parent settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Change PIN endpoint
  app.post("/api/change-pin", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { currentPin, newPin } = req.body;

      // Validate PIN format
      if (!currentPin || !newPin || currentPin.length !== 4 || newPin.length !== 4) {
        res.status(400).json({ error: "Invalid PIN format" });
        return;
      }

      // Get current settings
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      // Verify current PIN
      if (!verifyPIN(currentPin, settings.pinHash)) {
        res.status(403).json({ error: "Current PIN is incorrect" });
        return;
      }

      // Hash new PIN and update
      const newPinHash = hashPIN(newPin);
      await db
        .update(parentSettings)
        .set({ pinHash: newPinHash })
        .where(eq(parentSettings.userId, userId));

      res.json({ success: true, message: "PIN changed successfully" });
    } catch (error) {
      console.error("Error changing PIN:", error);
      res.status(500).json({ error: "Failed to change PIN" });
    }
  });

  // Admin: Get pending stories for review
  app.get("/api/admin/pending-stories", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingStories = await db
        .select()
        .from(stories)
        .where(eq(stories.status, "pending_review"))
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = pendingStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
        reviewedAt: s.reviewedAt?.getTime() || null,
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching pending stories:", error);
      res.status(500).json({ error: "Failed to fetch pending stories" });
    }
  });

  // Admin: Review story (approve or reject)
  app.post("/api/admin/review-story/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const reviewData = reviewStorySchema.parse(req.body);

      // Verify story exists and is pending review
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, id));

      if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
      }

      if (story.status !== "pending_review") {
        res.status(400).json({ error: "Story is not pending review" });
        return;
      }

      const now = new Date();
      let updateData: any = {
        approvedBy: userId,
        reviewedAt: now,
      };

      if (reviewData.action === "approve") {
        updateData.status = "published";
        updateData.rejectionReason = null;
        
        // Award coins to the story author when approved
        const [settings] = await db
          .select()
          .from(coinSettings)
          .limit(1);
        
        const coinsToAward = settings?.coinsPerStory || 10;
        
        await db
          .update(parentSettings)
          .set({ 
            coins: sql`${parentSettings.coins} + ${coinsToAward}` 
          })
          .where(eq(parentSettings.userId, story.userId));
      } else {
        // Rejected - set back to draft for editing
        updateData.status = "draft";
        updateData.rejectionReason = reviewData.rejectionReason || "Story did not meet quality standards";
      }

      const [updatedStory] = await db
        .update(stories)
        .set(updateData)
        .where(eq(stories.id, id))
        .returning();

      const storyWithTimestamp = {
        ...updatedStory,
        createdAt: updatedStory.createdAt.getTime(),
        reviewedAt: updatedStory.reviewedAt?.getTime() || null,
      };
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error reviewing story:", error);
      res.status(500).json({ error: "Failed to review story" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/stats", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [userCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(parentSettings);
      
      const [storyCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(stories);
      
      const [bookmarkCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookmarks);
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [recentStoriesResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(stories)
        .where(sql`${stories.createdAt} > ${sevenDaysAgo}`);

      const totalUsers = userCountResult?.count || 0;
      const totalStories = storyCountResult?.count || 0;
      const totalBookmarks = bookmarkCountResult?.count || 0;
      const recentStoriesCount = recentStoriesResult?.count || 0;

      const stats = {
        totalUsers,
        totalStories,
        totalBookmarks,
        averageStoriesPerUser: totalUsers > 0 ? (totalStories / totalUsers).toFixed(1) : "0",
        recentStoriesCount,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/stories", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allStories = await db
        .select()
        .from(stories)
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = allStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching all stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/admin/users", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allSettings = await db.select().from(parentSettings);
      
      const users = await Promise.all(
        allSettings.map(async (settings) => {
          const [storyCountResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(stories)
            .where(eq(stories.userId, settings.userId));
          
          return {
            userId: settings.userId,
            readingTimeLimit: settings.readingTimeLimit,
            fullscreenLockEnabled: settings.fullscreenLockEnabled,
            theme: settings.theme,
            storyCount: storyCountResult?.count || 0,
            trialEndsAt: settings.trialEndsAt ? settings.trialEndsAt.getTime() : null,
            trialStartedAt: settings.trialStartedAt ? settings.trialStartedAt.getTime() : null,
            subscriptionStatus: settings.subscriptionStatus ?? "trial",
            coins: settings.coins ?? 0,
            isAdmin: settings.isAdmin ?? false,
            isBlocked: settings.isBlocked ?? false,
          };
        })
      );
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId/block", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { isBlocked } = req.body;

      if (typeof isBlocked !== "boolean") {
        res.status(400).json({ error: "isBlocked must be a boolean" });
        return;
      }

      await db
        .update(parentSettings)
        .set({ isBlocked })
        .where(eq(parentSettings.userId, userId));

      res.json({ success: true, userId, isBlocked });
    } catch (error) {
      console.error("Error updating user block status:", error);
      res.status(500).json({ error: "Failed to update user block status" });
    }
  });

  app.patch("/api/admin/users/:userId/admin", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;

      if (typeof isAdmin !== "boolean") {
        res.status(400).json({ error: "isAdmin must be a boolean" });
        return;
      }

      await db
        .update(parentSettings)
        .set({ isAdmin })
        .where(eq(parentSettings.userId, userId));

      res.json({ success: true, userId, isAdmin });
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ error: "Failed to update user admin status" });
    }
  });

  app.patch("/api/admin/users/:userId/add-coins", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        res.status(400).json({ error: "amount must be a positive number" });
        return;
      }

      const [user] = await db
        .select({ coins: parentSettings.coins })
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const newCoins = (user.coins ?? 0) + amount;

      await db
        .update(parentSettings)
        .set({ coins: newCoins })
        .where(eq(parentSettings.userId, userId));

      res.json({ success: true, userId, coinsAdded: amount, totalCoins: newCoins });
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(500).json({ error: "Failed to add coins" });
    }
  });

  app.delete("/api/admin/stories/:storyId", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { storyId } = req.params;
      
      const result = await db
        .delete(stories)
        .where(eq(stories.id, storyId))
        .returning();
      
      if (result.length > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Story not found" });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // Public endpoint for active subscription plans (sanitized for public consumption)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const activePlans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(desc(subscriptionPlans.createdAt));
      
      // Return only public-facing fields, exclude internal payment identifiers
      const publicPlans = activePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        features: plan.features ?? [],
        maxStories: plan.maxStories,
      }));
      res.json(publicPlans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/admin/subscription-plans", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allPlans = await db
        .select()
        .from(subscriptionPlans)
        .orderBy(desc(subscriptionPlans.createdAt));
      
      const plansWithTimestamp = allPlans.map(plan => ({
        ...plan,
        createdAt: plan.createdAt.getTime(),
        updatedAt: plan.updatedAt.getTime(),
      }));
      res.json(plansWithTimestamp);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/admin/subscription-plans", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      
      const [plan] = await db
        .insert(subscriptionPlans)
        .values({
          id: `plan-${Date.now()}`,
          ...planData,
          price: planData.price.toString(),
        })
        .returning();
      
      const planWithTimestamp = {
        ...plan,
        createdAt: plan.createdAt.getTime(),
        updatedAt: plan.updatedAt.getTime(),
      };
      res.json(planWithTimestamp);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.patch("/api/admin/subscription-plans/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = updateSubscriptionPlanSchema.parse(req.body);
      
      const updateData: any = { ...updates, updatedAt: new Date() };
      if (updates.price !== undefined) {
        updateData.price = updates.price.toString();
      }
      
      const [plan] = await db
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, id))
        .returning();
      
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      const planWithTimestamp = {
        ...plan,
        createdAt: plan.createdAt.getTime(),
        updatedAt: plan.updatedAt.getTime(),
      };
      res.json(planWithTimestamp);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id))
        .returning();
      
      if (result.length > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Plan not found" });
      }
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Coin management endpoints
  app.get("/api/admin/coin-settings", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      let [settings] = await db
        .select()
        .from(coinSettings)
        .limit(1);
      
      // Create default settings if they don't exist
      if (!settings) {
        [settings] = await db
          .insert(coinSettings)
          .values({
            id: `coin-settings-${Date.now()}`,
            coinsPerStory: 10,
          })
          .returning();
      }
      
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: settings.updatedAt.getTime(),
      };
      res.json(settingsWithTimestamp);
    } catch (error) {
      console.error("Error fetching coin settings:", error);
      res.status(500).json({ error: "Failed to fetch coin settings" });
    }
  });

  app.put("/api/admin/coin-settings", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = updateCoinSettingsSchema.parse(req.body);
      
      // Get or create settings
      let [settings] = await db
        .select()
        .from(coinSettings)
        .limit(1);
      
      if (!settings) {
        [settings] = await db
          .insert(coinSettings)
          .values({
            id: `coin-settings-${Date.now()}`,
            coinsPerStory: updates.coinsPerStory,
          })
          .returning();
      } else {
        [settings] = await db
          .update(coinSettings)
          .set({
            coinsPerStory: updates.coinsPerStory,
            updatedAt: new Date(),
          })
          .where(eq(coinSettings.id, settings.id))
          .returning();
      }
      
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: settings.updatedAt.getTime(),
      };
      res.json(settingsWithTimestamp);
    } catch (error) {
      console.error("Error updating coin settings:", error);
      res.status(500).json({ error: "Failed to update coin settings" });
    }
  });

  // Grant coins to a user (admin only)
  app.post("/api/admin/grant-coins", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: "Valid userId and positive amount required" });
        return;
      }
      
      // Check if user settings exist
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));
      
      if (!settings) {
        res.status(404).json({ error: "User settings not found. User may need to complete child lock setup first." });
        return;
      }
      
      // Add coins to user
      const [updated] = await db
        .update(parentSettings)
        .set({ 
          coins: sql`${parentSettings.coins} + ${amount}` 
        })
        .where(eq(parentSettings.userId, userId))
        .returning();
      
      res.json({ 
        success: true, 
        userId, 
        coinsAdded: amount, 
        newBalance: updated.coins 
      });
    } catch (error) {
      console.error("Error granting coins:", error);
      res.status(500).json({ error: "Failed to grant coins" });
    }
  });

  // Public endpoint for users to see plan coin costs
  app.get("/api/plan-coin-costs", async (req, res) => {
    try {
      const costs = await db
        .select()
        .from(planCoinCosts);
      
      const publicCosts = costs.map(c => ({
        id: c.id,
        planId: c.planId,
        coinCost: c.coinCost,
      }));
      res.json(publicCosts);
    } catch (error) {
      console.error("Error fetching plan coin costs:", error);
      res.status(500).json({ error: "Failed to fetch plan coin costs" });
    }
  });

  // Admin endpoint with full details
  app.get("/api/admin/plan-coin-costs", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const costs = await db
        .select()
        .from(planCoinCosts);
      
      const costsWithTimestamp = costs.map(c => ({
        ...c,
        createdAt: c.createdAt.getTime(),
        updatedAt: c.updatedAt.getTime(),
      }));
      res.json(costsWithTimestamp);
    } catch (error) {
      console.error("Error fetching plan coin costs:", error);
      res.status(500).json({ error: "Failed to fetch plan coin costs" });
    }
  });

  app.put("/api/admin/plan-coin-costs", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = updatePlanCoinCostSchema.parse(req.body);
      
      // Check if plan exists
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, updates.planId));
      
      if (!plan) {
        res.status(404).json({ error: "Subscription plan not found" });
        return;
      }
      
      // Check if cost record exists for this plan
      const [existing] = await db
        .select()
        .from(planCoinCosts)
        .where(eq(planCoinCosts.planId, updates.planId));
      
      let cost;
      if (existing) {
        [cost] = await db
          .update(planCoinCosts)
          .set({
            coinCost: updates.coinCost,
            updatedAt: new Date(),
          })
          .where(eq(planCoinCosts.id, existing.id))
          .returning();
      } else {
        [cost] = await db
          .insert(planCoinCosts)
          .values({
            id: `plan-coin-cost-${Date.now()}`,
            planId: updates.planId,
            coinCost: updates.coinCost,
          })
          .returning();
      }
      
      const costWithTimestamp = {
        ...cost,
        createdAt: cost.createdAt.getTime(),
        updatedAt: cost.updatedAt.getTime(),
      };
      res.json(costWithTimestamp);
    } catch (error) {
      console.error("Error updating plan coin cost:", error);
      res.status(500).json({ error: "Failed to update plan coin cost" });
    }
  });

  // Coin packages endpoints
  // Public endpoint to get active coin packages
  app.get("/api/coin-packages", async (req, res) => {
    try {
      const activePackages = await db
        .select()
        .from(coinPackages)
        .where(eq(coinPackages.isActive, true))
        .orderBy(coinPackages.coins);
      
      const publicPackages = activePackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        coins: pkg.coins,
        price: pkg.price.toString(),
        currency: pkg.currency,
      }));
      res.json(publicPackages);
    } catch (error) {
      console.error("Error fetching coin packages:", error);
      res.status(500).json({ error: "Failed to fetch coin packages" });
    }
  });

  // Admin endpoints for managing coin packages
  app.get("/api/admin/coin-packages", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const packages = await db
        .select()
        .from(coinPackages)
        .orderBy(coinPackages.coins);
      
      const packagesWithTimestamp = packages.map(pkg => ({
        ...pkg,
        price: pkg.price.toString(),
        createdAt: pkg.createdAt.getTime(),
        updatedAt: pkg.updatedAt.getTime(),
      }));
      res.json(packagesWithTimestamp);
    } catch (error) {
      console.error("Error fetching coin packages:", error);
      res.status(500).json({ error: "Failed to fetch coin packages" });
    }
  });

  app.post("/api/admin/coin-packages", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const packageData = insertCoinPackageSchema.parse(req.body);
      
      const [pkg] = await db
        .insert(coinPackages)
        .values({
          id: `coin-package-${Date.now()}`,
          ...packageData,
          price: packageData.price.toString(),
        })
        .returning();
      
      const packageWithTimestamp = {
        ...pkg,
        price: pkg.price.toString(),
        createdAt: pkg.createdAt.getTime(),
        updatedAt: pkg.updatedAt.getTime(),
      };
      res.json(packageWithTimestamp);
    } catch (error) {
      console.error("Error creating coin package:", error);
      res.status(500).json({ error: "Failed to create coin package" });
    }
  });

  app.patch("/api/admin/coin-packages/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = updateCoinPackageSchema.parse(req.body);
      
      const updateData: any = { ...updates, updatedAt: new Date() };
      if (updates.price !== undefined) {
        updateData.price = updates.price.toString();
      }
      
      const [pkg] = await db
        .update(coinPackages)
        .set(updateData)
        .where(eq(coinPackages.id, id))
        .returning();
      
      if (!pkg) {
        return res.status(404).json({ error: "Coin package not found" });
      }
      
      const packageWithTimestamp = {
        ...pkg,
        price: pkg.price.toString(),
        createdAt: pkg.createdAt.getTime(),
        updatedAt: pkg.updatedAt.getTime(),
      };
      res.json(packageWithTimestamp);
    } catch (error) {
      console.error("Error updating coin package:", error);
      res.status(500).json({ error: "Failed to update coin package" });
    }
  });

  app.delete("/api/admin/coin-packages/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .delete(coinPackages)
        .where(eq(coinPackages.id, id))
        .returning();
      
      if (result.length > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Coin package not found" });
      }
    } catch (error) {
      console.error("Error deleting coin package:", error);
      res.status(500).json({ error: "Failed to delete coin package" });
    }
  });

  // User endpoint to purchase plan with coins
  app.post("/api/subscriptions/purchase-with-coins", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { planId } = req.body;
      
      if (!planId) {
        res.status(400).json({ error: "Plan ID is required" });
        return;
      }
      
      // Get plan
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!plan || !plan.isActive) {
        res.status(404).json({ error: "Plan not found or inactive" });
        return;
      }
      
      // Get plan coin cost
      const [costRecord] = await db
        .select()
        .from(planCoinCosts)
        .where(eq(planCoinCosts.planId, planId));
      
      if (!costRecord || costRecord.coinCost <= 0) {
        res.status(400).json({ error: "This plan cannot be purchased with coins" });
        return;
      }
      
      // Get user's current coins
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));
      
      if (!settings) {
        res.status(404).json({ error: "User settings not found" });
        return;
      }
      
      if (settings.coins < costRecord.coinCost) {
        res.status(400).json({ 
          error: "Insufficient coins",
          required: costRecord.coinCost,
          available: settings.coins
        });
        return;
      }
      
      // Deduct coins
      await db
        .update(parentSettings)
        .set({ 
          coins: sql`${parentSettings.coins} - ${costRecord.coinCost}` 
        })
        .where(eq(parentSettings.userId, userId));
      
      // Create subscription
      const now = new Date();
      let endDate: Date | null = null;
      
      if (plan.billingPeriod === "monthly") {
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billingPeriod === "yearly") {
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.billingPeriod === "weekly") {
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
      }
      
      const [subscription] = await db
        .insert(userSubscriptions)
        .values({
          id: `subscription-${Date.now()}`,
          userId,
          planId,
          status: "active",
          startDate: now,
          endDate,
        })
        .returning();
      
      const subscriptionWithTimestamp = {
        ...subscription,
        startDate: subscription.startDate.getTime(),
        endDate: subscription.endDate?.getTime() || null,
        canceledAt: subscription.canceledAt?.getTime() || null,
        createdAt: subscription.createdAt.getTime(),
      };
      res.json(subscriptionWithTimestamp);
    } catch (error) {
      console.error("Error purchasing plan with coins:", error);
      res.status(500).json({ error: "Failed to purchase plan with coins" });
    }
  });

  // Initialize Razorpay (only if keys are provided)
  let razorpay: Razorpay | null = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // Get subscription/trial status
  app.get("/api/subscription/status", authenticateUser, getSubscriptionInfo, async (req: SubscriptionRequest, res) => {
    try {
      const userId = req.userId!;
      
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));
      
      if (!settings) {
        return res.status(404).json({ error: "User settings not found" });
      }

      res.json({
        ...req.subscriptionInfo,
        coins: settings.coins,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // Activate trial (called when user completes setup)
  app.post("/api/subscription/activate-trial", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));
      
      if (!settings) {
        return res.status(404).json({ error: "User settings not found" });
      }

      // Check if trial already activated
      if (settings.trialStartedAt) {
        return res.json({
          message: "Trial already activated",
          trialEndsAt: settings.trialEndsAt?.getTime(),
        });
      }

      // Activate 7-day trial
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      await db
        .update(parentSettings)
        .set({
          trialStartedAt: now.getTime(),
          trialEndsAt: trialEnd.getTime(),
          subscriptionStatus: "trial",
        })
        .where(eq(parentSettings.userId, userId));

      res.json({
        message: "Trial activated successfully",
        trialEndsAt: trialEnd.getTime(),
      });
    } catch (error) {
      console.error("Error activating trial:", error);
      res.status(500).json({ error: "Failed to activate trial" });
    }
  });

  // Create Razorpay order for coin purchase
  app.post("/api/razorpay/create-order", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ 
          error: "Payment system not configured. Please contact support." 
        });
      }

      const { coinPackageId } = req.body;
      
      const [coinPackage] = await db
        .select()
        .from(coinPackages)
        .where(eq(coinPackages.id, coinPackageId));
      
      if (!coinPackage || !coinPackage.isActive) {
        return res.status(404).json({ error: "Coin package not found or inactive" });
      }

      const amountInPaise = Math.round(Number(coinPackage.price) * 100);

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: coinPackage.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: req.userId!,
          coinPackageId,
          coins: coinPackage.coins.toString(),
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        coinPackage: {
          id: coinPackage.id,
          name: coinPackage.name,
          coins: coinPackage.coins,
          price: coinPackage.price,
        },
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment and credit coins
  app.post("/api/razorpay/verify-payment", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: "Payment system not configured" });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, coinPackageId } = req.body;
      const userId = req.userId!;

      console.log("Payment verification started:", { 
        userId, 
        orderId: razorpay_order_id, 
        paymentId: razorpay_payment_id,
        coinPackageId 
      });

      // Step 1: Verify signature using HMAC SHA256
      const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(signatureBody)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error("Signature verification failed:", {
          expected: expectedSignature,
          received: razorpay_signature
        });
        return res.status(400).json({ 
          success: false, 
          error: "Invalid payment signature - potential tampering detected" 
        });
      }

      console.log("Signature verified successfully");

      // Step 2: Fetch payment details from Razorpay to verify payment status
      let payment;
      try {
        payment = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (error) {
        console.error("Failed to fetch payment from Razorpay:", error);
        return res.status(400).json({
          success: false,
          error: "Failed to verify payment with payment gateway"
        });
      }

      // Step 3: Verify payment is captured (NOT just authorized)
      if (payment.status !== "captured") {
        console.error("Payment not captured:", { 
          status: payment.status, 
          paymentId: razorpay_payment_id 
        });
        return res.status(400).json({
          success: false,
          error: `Payment not captured. Status: ${payment.status}. Funds must be captured before crediting coins.`
        });
      }

      // Step 4: Verify order ID matches
      if (payment.order_id !== razorpay_order_id) {
        console.error("Order ID mismatch:", {
          expected: razorpay_order_id,
          received: payment.order_id
        });
        return res.status(400).json({
          success: false,
          error: "Order ID mismatch"
        });
      }

      console.log("Payment status verified:", payment.status);

      // Step 4.5: Check if this payment has already been processed (prevent replay attacks)
      const [existingPayment] = await db
        .select()
        .from(processedPayments)
        .where(eq(processedPayments.razorpayPaymentId, razorpay_payment_id));

      if (existingPayment) {
        console.error("Payment already processed:", {
          paymentId: razorpay_payment_id,
          processedAt: existingPayment.processedAt
        });
        return res.status(400).json({
          success: false,
          error: "This payment has already been processed. Coins cannot be credited twice."
        });
      }

      // Step 5: Get coin package and verify amount
      const [coinPackage] = await db
        .select()
        .from(coinPackages)
        .where(eq(coinPackages.id, coinPackageId));

      if (!coinPackage) {
        console.error("Coin package not found:", coinPackageId);
        return res.status(404).json({ 
          success: false,
          error: "Coin package not found" 
        });
      }

      // Verify payment amount matches package price
      const expectedAmount = Math.round(Number(coinPackage.price) * 100); // in paise
      if (payment.amount !== expectedAmount) {
        console.error("Amount mismatch:", {
          expected: expectedAmount,
          received: payment.amount
        });
        return res.status(400).json({
          success: false,
          error: "Payment amount mismatch"
        });
      }

      // Step 6: Record payment as processed (idempotency protection)
      await db.insert(processedPayments).values({
        id: `payment-${Date.now()}`,
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: payment.amount,
        currency: payment.currency,
        coinPackageId,
        coinsAwarded: coinPackage.coins,
      });

      // Step 7: Credit coins to user
      console.log("Crediting coins to user:", { userId, coins: coinPackage.coins });
      await db
        .update(parentSettings)
        .set({
          coins: sql`${parentSettings.coins} + ${coinPackage.coins}`,
        })
        .where(eq(parentSettings.userId, userId));

      // Get updated coin balance
      const [updatedSettings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      console.log("Payment verification successful:", {
        userId,
        coinsAdded: coinPackage.coins,
        newBalance: updatedSettings?.coins
      });

      res.json({
        success: true,
        message: "Payment verified and coins credited",
        coinsAdded: coinPackage.coins,
        totalCoins: updatedSettings?.coins || 0,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to verify payment" 
      });
    }
  });

  // CHECKPOINT ROUTES
  // Get all checkpoints for a parent
  app.get("/api/checkpoints", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userCheckpoints = await db
        .select()
        .from(checkpoints)
        .where(and(
          eq(checkpoints.userId, userId),
          eq(checkpoints.status, "active")
        ))
        .orderBy(desc(checkpoints.createdAt));
      
      const checkpointsWithTimestamp = userCheckpoints.map(c => ({
        ...c,
        createdAt: c.createdAt.getTime(),
        updatedAt: c.updatedAt.getTime(),
      }));
      res.json(checkpointsWithTimestamp);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      res.status(500).json({ error: "Failed to fetch checkpoints" });
    }
  });

  // Get checkpoints with progress
  app.get("/api/checkpoints/with-progress", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userCheckpoints = await db
        .select()
        .from(checkpoints)
        .where(and(
          eq(checkpoints.userId, userId),
          eq(checkpoints.status, "active")
        ))
        .orderBy(desc(checkpoints.createdAt));
      
      const checkpointsWithProgress = await Promise.all(
        userCheckpoints.map(async (checkpoint) => {
          const [progress] = await db
            .select()
            .from(checkpointProgress)
            .where(and(
              eq(checkpointProgress.checkpointId, checkpoint.id),
              eq(checkpointProgress.userId, userId)
            ));
          
          return {
            ...checkpoint,
            createdAt: checkpoint.createdAt.getTime(),
            updatedAt: checkpoint.updatedAt.getTime(),
            currentProgress: progress?.currentProgress || 0,
            completedAt: progress?.completedAt?.getTime() || null,
            isCompleted: !!progress?.completedAt,
          };
        })
      );
      
      res.json(checkpointsWithProgress);
    } catch (error) {
      console.error("Error fetching checkpoints with progress:", error);
      res.status(500).json({ error: "Failed to fetch checkpoints" });
    }
  });

  // Create a checkpoint
  app.post("/api/checkpoints", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const checkpointData = insertCheckpointSchema.parse(req.body);

      const [newCheckpoint] = await db
        .insert(checkpoints)
        .values({
          id: `checkpoint-${Date.now()}`,
          userId,
          ...checkpointData,
          status: "active",
        })
        .returning();
      
      // Create initial progress record
      await db.insert(checkpointProgress).values({
        id: `progress-${Date.now()}`,
        checkpointId: newCheckpoint.id,
        userId,
        currentProgress: 0,
      });
      
      const checkpointWithTimestamp = {
        ...newCheckpoint,
        createdAt: newCheckpoint.createdAt.getTime(),
        updatedAt: newCheckpoint.updatedAt.getTime(),
      };
      res.json(checkpointWithTimestamp);
    } catch (error) {
      console.error("Error creating checkpoint:", error);
      res.status(500).json({ error: "Failed to create checkpoint" });
    }
  });

  // Delete a checkpoint
  app.delete("/api/checkpoints/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Archive instead of delete
      await db
        .update(checkpoints)
        .set({ status: "archived" })
        .where(and(
          eq(checkpoints.id, id),
          eq(checkpoints.userId, userId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting checkpoint:", error);
      res.status(500).json({ error: "Failed to delete checkpoint" });
    }
  });

  // Get checkpoint progress for current user
  app.get("/api/checkpoints/progress", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;

      const progressData = await db
        .select({
          id: checkpointProgress.id,
          checkpointId: checkpointProgress.checkpointId,
          currentProgress: checkpointProgress.currentProgress,
          completedAt: checkpointProgress.completedAt,
          checkpoint: checkpoints,
        })
        .from(checkpointProgress)
        .innerJoin(checkpoints, eq(checkpointProgress.checkpointId, checkpoints.id))
        .where(and(
          eq(checkpointProgress.userId, userId),
          eq(checkpoints.status, "active")
        ));

      const progressWithTimestamps = progressData.map(p => ({
        ...p,
        completedAt: p.completedAt?.getTime() || null,
      }));

      res.json(progressWithTimestamps);
    } catch (error) {
      console.error("Error fetching checkpoint progress:", error);
      res.status(500).json({ error: "Failed to fetch checkpoint progress" });
    }
  });

  // Track story completion and update checkpoint progress
  app.post("/api/checkpoints/track-story", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const newlyCompleted = [];

      // Get all active checkpoints for user
      const userCheckpoints = await db
        .select()
        .from(checkpoints)
        .where(and(
          eq(checkpoints.userId, userId),
          eq(checkpoints.status, "active")
        ));

      // Update progress for each checkpoint
      for (const checkpoint of userCheckpoints) {
        const [progress] = await db
          .select()
          .from(checkpointProgress)
          .where(and(
            eq(checkpointProgress.checkpointId, checkpoint.id),
            eq(checkpointProgress.userId, userId)
          ));

        if (!progress || progress.completedAt) continue;

        let newProgress = progress.currentProgress;
        
        if (checkpoint.goalType === "stories_read") {
          newProgress += 1;
        }

        // Check if goal is completed
        const isCompleted = newProgress >= checkpoint.goalTarget;

        // Update progress
        const [updated] = await db
          .update(checkpointProgress)
          .set({
            currentProgress: newProgress,
            completedAt: isCompleted ? new Date() : null,
          })
          .where(eq(checkpointProgress.id, progress.id))
          .returning();

        if (isCompleted && !progress.completedAt) {
          newlyCompleted.push(updated);
        }
      }

      res.json({ 
        success: true, 
        newlyCompleted,
      });
    } catch (error) {
      console.error("Error tracking story:", error);
      res.status(500).json({ error: "Failed to track story" });
    }
  });

  // Record reading session and update checkpoint progress
  app.post("/api/reading-sessions", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const sessionData = insertReadingSessionSchema.parse(req.body);

      // Insert reading session
      const [session] = await db
        .insert(readingSessions)
        .values({
          id: `session-${Date.now()}`,
          userId,
          ...sessionData,
        })
        .returning();

      // Get all active checkpoints for user
      const userCheckpoints = await db
        .select()
        .from(checkpoints)
        .where(and(
          eq(checkpoints.userId, userId),
          eq(checkpoints.status, "active")
        ));

      // Update progress for each checkpoint
      for (const checkpoint of userCheckpoints) {
        const [progress] = await db
          .select()
          .from(checkpointProgress)
          .where(and(
            eq(checkpointProgress.checkpointId, checkpoint.id),
            eq(checkpointProgress.userId, userId)
          ));

        if (!progress) continue;

        let newProgress = progress.currentProgress;
        
        if (checkpoint.goalType === "stories_read") {
          newProgress += 1;
        } else if (checkpoint.goalType === "reading_minutes") {
          newProgress += sessionData.durationMinutes;
        } else if (checkpoint.goalType === "reading_days") {
          // Check if user already read today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todaySessions = await db
            .select()
            .from(readingSessions)
            .where(and(
              eq(readingSessions.userId, userId),
              sql`${readingSessions.readingDate} >= ${today}`
            ));

          if (todaySessions.length === 1) { // This is the first session today
            newProgress += 1;
          }
        }

        // Check if goal is completed
        const isCompleted = newProgress >= checkpoint.goalTarget;
        
        await db
          .update(checkpointProgress)
          .set({
            currentProgress: newProgress,
            completedAt: isCompleted && !progress.completedAt ? new Date() : progress.completedAt,
          })
          .where(eq(checkpointProgress.id, progress.id));
      }

      res.json({
        ...session,
        readingDate: session.readingDate.getTime(),
        createdAt: session.createdAt.getTime(),
      });
    } catch (error) {
      console.error("Error recording reading session:", error);
      res.status(500).json({ error: "Failed to record reading session" });
    }
  });

  // PDF proxy endpoint to serve PDFs (supports both base64 and URLs)
  app.get("/api/pdf-proxy/:storyId", async (req, res) => {
    try {
      const { storyId } = req.params;
      
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId));
      
      if (!story || !story.pdfUrl) {
        return res.status(404).json({ error: "PDF not found" });
      }

      let bufferData: Buffer;

      // Check if PDF is base64 encoded (starts with data:application/pdf;base64,)
      if (story.pdfUrl.startsWith('data:application/pdf;base64,')) {
        // Extract base64 data and convert to buffer
        const base64Data = story.pdfUrl.split(',')[1];
        bufferData = Buffer.from(base64Data, 'base64');
      } else {
        // Fetch the PDF from URL (Firebase or external)
        const pdfResponse = await fetch(story.pdfUrl);
        if (!pdfResponse.ok) {
          return res.status(404).json({ error: "Failed to fetch PDF" });
        }
        const buffer = await pdfResponse.arrayBuffer();
        bufferData = Buffer.from(buffer);
      }

      // Set proper headers for PDF display with CORS
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", bufferData.length.toString());
      res.setHeader("Content-Disposition", "inline; filename=story.pdf");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("X-Content-Type-Options", "nosniff");
      
      // Send the PDF buffer
      res.end(bufferData);
    } catch (error) {
      res.status(500).json({ error: "Failed to serve PDF" });
    }
  });

  // Audio proxy endpoint to serve audio (supports both base64 and URLs)
  app.get("/api/audio-proxy/:storyId", async (req, res) => {
    try {
      const { storyId } = req.params;
      
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId));
      
      if (!story || (!story.audioUrl && !story.voiceoverUrl)) {
        return res.status(404).json({ error: "Audio not found" });
      }

      // Prioritize voiceoverUrl (parent's recorded voice) over audioUrl (AI/uploaded audio)
      const audioSource = story.voiceoverUrl || story.audioUrl;
      let bufferData: Buffer;
      let contentType = "audio/mpeg";

      // Check if audio is base64 encoded (starts with data:audio/)
      if (audioSource!.startsWith('data:audio/')) {
        // Extract base64 data and content type
        const matches = audioSource!.match(/^data:(audio\/[^;]+);base64,(.+)$/);
        if (matches) {
          contentType = matches[1];
          bufferData = Buffer.from(matches[2], 'base64');
        } else {
          return res.status(400).json({ error: "Invalid audio data format" });
        }
      } else {
        // Fetch the audio from URL (Firebase or external)
        const audioResponse = await fetch(audioSource!);
        if (!audioResponse.ok) {
          return res.status(404).json({ error: "Failed to fetch audio" });
        }
        const buffer = await audioResponse.arrayBuffer();
        bufferData = Buffer.from(buffer);
        
        // Try to get content type from response
        const responseContentType = audioResponse.headers.get("content-type");
        if (responseContentType) {
          contentType = responseContentType;
        }
      }

      // Set proper headers for audio playback with CORS
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", bufferData.length);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      
      // Send the audio buffer
      res.end(bufferData);
    } catch (error) {
      res.status(500).json({ error: "Failed to serve audio" });
    }
  });

  // Game and Badge endpoints
  app.post("/api/games/submit", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { storyId, gameType, score, totalScore } = req.body;
      const userId = req.userId!;

      // Save game session
      const gameSessionId = crypto.randomUUID();
      const passed = score >= (totalScore * 0.6); // 60% pass rate

      await db.insert(gameSessions).values({
        id: gameSessionId,
        userId,
        storyId,
        gameType,
        score,
        totalScore,
        passed,
      });

      // Award badge if passed
      let badgeId = null;
      if (passed) {
        badgeId = crypto.randomUUID();
        const badgeNames = {
          quiz: "Quiz Master",
          wordMatching: "Word Wizard",
          memory: "Memory Champion",
          drawing: "Creative Artist",
        };

        await db.insert(badges).values({
          id: badgeId,
          userId,
          storyId,
          badgeName: badgeNames[gameType as keyof typeof badgeNames],
          badgeIcon: gameType,
          gameType,
        });
      }

      res.json({ 
        success: true, 
        passed,
        badgeId,
      });
    } catch (error) {
      console.error("Error submitting game:", error);
      res.status(500).json({ error: "Failed to submit game" });
    }
  });

  app.get("/api/badges", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;

      const userBadges = await db
        .select()
        .from(badges)
        .where(eq(badges.userId, userId))
        .orderBy(desc(badges.earnedAt));

      const badgesWithTimestamp = userBadges.map(badge => ({
        ...badge,
        earnedAt: badge.earnedAt.getTime(),
        createdAt: badge.createdAt.getTime(),
      }));

      res.json(badgesWithTimestamp);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/story/:storyId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { storyId } = req.params;

      const storyBadges = await db
        .select()
        .from(badges)
        .where(
          and(
            eq(badges.userId, userId),
            eq(badges.storyId, storyId)
          )
        );

      const badgesWithTimestamp = storyBadges.map(badge => ({
        ...badge,
        earnedAt: badge.earnedAt.getTime(),
        createdAt: badge.createdAt.getTime(),
      }));

      res.json(badgesWithTimestamp);
    } catch (error) {
      console.error("Error fetching story badges:", error);
      res.status(500).json({ error: "Failed to fetch story badges" });
    }
  });

  // Story Categories endpoints
  app.get("/api/admin/categories", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const categories = await db
        .select()
        .from(storyCategories)
        .orderBy(storyCategories.name);
      
      const categoriesWithTimestamp = categories.map(cat => ({
        ...cat,
        createdAt: cat.createdAt.getTime(),
      }));
      res.json(categoriesWithTimestamp);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, slug, isActive } = insertStoryCategorySchema.parse(req.body);
      
      const [category] = await db
        .insert(storyCategories)
        .values({
          id: `cat-${Date.now()}`,
          name,
          slug,
          isActive: isActive ?? true,
        })
        .returning();
      
      const categoryWithTimestamp = {
        ...category,
        createdAt: category.createdAt.getTime(),
      };
      res.json(categoryWithTimestamp);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.delete("/api/admin/categories/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      await db
        .delete(storyCategories)
        .where(eq(storyCategories.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Story Types endpoints
  app.get("/api/admin/story-types", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const types = await db
        .select()
        .from(storyTypes)
        .orderBy(storyTypes.name);
      
      const typesWithTimestamp = types.map(type => ({
        ...type,
        createdAt: type.createdAt.getTime(),
      }));
      res.json(typesWithTimestamp);
    } catch (error) {
      console.error("Error fetching story types:", error);
      res.status(500).json({ error: "Failed to fetch story types" });
    }
  });

  app.post("/api/admin/story-types", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, slug, isActive } = insertStoryTypeSchema.parse(req.body);
      
      const [type] = await db
        .insert(storyTypes)
        .values({
          id: `type-${Date.now()}`,
          name,
          slug,
          isActive: isActive ?? true,
        })
        .returning();
      
      const typeWithTimestamp = {
        ...type,
        createdAt: type.createdAt.getTime(),
      };
      res.json(typeWithTimestamp);
    } catch (error) {
      console.error("Error creating story type:", error);
      res.status(500).json({ error: "Failed to create story type" });
    }
  });

  app.delete("/api/admin/story-types/:id", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      await db
        .delete(storyTypes)
        .where(eq(storyTypes.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting story type:", error);
      res.status(500).json({ error: "Failed to delete story type" });
    }
  });

  // Public endpoints to fetch categories and types
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(storyCategories)
        .where(eq(storyCategories.isActive, true))
        .orderBy(storyCategories.name);
      
      const categoriesWithTimestamp = categories.map(cat => ({
        ...cat,
        createdAt: cat.createdAt.getTime(),
      }));
      res.json(categoriesWithTimestamp);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/story-types", async (req, res) => {
    try {
      const types = await db
        .select()
        .from(storyTypes)
        .where(eq(storyTypes.isActive, true))
        .orderBy(storyTypes.name);
      
      const typesWithTimestamp = types.map(type => ({
        ...type,
        createdAt: type.createdAt.getTime(),
      }));
      res.json(typesWithTimestamp);
    } catch (error) {
      console.error("Error fetching story types:", error);
      res.status(500).json({ error: "Failed to fetch story types" });
    }
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard/children", async (req, res) => {
    try {
      // Get top children by badge count
      const topChildren = await db
        .select({
          childName: parentSettings.childName,
          userId: badges.userId,
          badgeCount: sql<number>`count(${badges.id})`,
        })
        .from(badges)
        .innerJoin(parentSettings, eq(badges.userId, parentSettings.userId))
        .groupBy(badges.userId, parentSettings.childName)
        .orderBy(desc(sql`count(${badges.id})`))
        .limit(10);

      res.json(topChildren);
    } catch (error) {
      console.error("Error fetching children leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch children leaderboard" });
    }
  });

  app.get("/api/leaderboard/parents", async (req, res) => {
    try {
      // Get top parents by published stories count
      const topParents = await db
        .select({
          childName: parentSettings.childName,
          userId: stories.userId,
          storyCount: sql<number>`count(${stories.id})`,
        })
        .from(stories)
        .innerJoin(parentSettings, eq(stories.userId, parentSettings.userId))
        .where(eq(stories.status, "published"))
        .groupBy(stories.userId, parentSettings.childName)
        .orderBy(desc(sql`count(${stories.id})`))
        .limit(10);

      res.json(topParents);
    } catch (error) {
      console.error("Error fetching parents leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch parents leaderboard" });
    }
  });


  const httpServer = createServer(app);
  
  // Initialize WebSocket
  initializeWebSocket(httpServer);

  return httpServer;
}
