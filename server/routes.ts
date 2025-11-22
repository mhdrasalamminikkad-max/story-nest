import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticateUser, checkNotBlocked, type AuthRequest } from "./middleware/auth";
import { requireAdmin } from "./middleware/adminAuth";
import { getSubscriptionInfo, type SubscriptionRequest } from "./middleware/subscription";
import { insertStorySchema, insertParentSettingsSchema, insertBookmarkSchema, reviewStorySchema, insertSubscriptionPlanSchema, updateSubscriptionPlanSchema, updateCoinSettingsSchema, updatePlanCoinCostSchema, insertCoinPackageSchema, updateCoinPackageSchema, insertCheckpointSchema, insertReadingSessionSchema } from "@shared/schema";
import type { Story, ParentSettings, Bookmark, SubscriptionPlan } from "@shared/schema";
import { hashPIN, verifyPIN } from "./utils/crypto";
import { db } from "./db";
import { stories, parentSettings, bookmarks, subscriptionPlans, coinSettings, planCoinCosts, userSubscriptions, coinPackages, processedPayments, checkpoints, checkpointProgress, readingSessions } from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stories endpoints - Public feed (published stories only)
  app.get("/api/stories", async (req, res) => {
    try {
      const { storyType, category, language } = req.query;
      
      let query = db.select().from(stories);
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
        createdAt: s.createdAt.getTime(),
        reviewedAt: s.reviewedAt?.getTime() || null,
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
        .select()
        .from(stories)
        .where(eq(stories.userId, userId))
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = userStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
        reviewedAt: s.reviewedAt?.getTime() || null,
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
        .select()
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
            createdAt: s.createdAt.getTime(),
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

  // Create new story (all stories require admin approval)
  app.post("/api/stories", authenticateUser, checkNotBlocked, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storyData = insertStorySchema.parse(req.body);

      const [story] = await db
        .insert(stories)
        .values({
          id: `story-${Date.now()}`,
          ...storyData,
          userId,
          status: "pending_review",
          approvedBy: null,
          reviewedAt: null,
        })
        .returning();
      
      const storyWithTimestamp = {
        ...story,
        createdAt: story.createdAt.getTime(),
        reviewedAt: story.reviewedAt?.getTime() || null,
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
          voiceoverUrl: updates.voiceoverUrl,
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
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const settingsData = insertParentSettingsSchema.parse(req.body);
      
      const pinHash = hashPIN(settingsData.pin);

      // Check if this is the first user (make them admin automatically)
      const existingUsers = await db.select().from(parentSettings);
      const isFirstUser = existingUsers.length === 0;

      // Auto-activate 7-day trial for new users
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      // SECURITY: isAdmin is never set from client input
      // Only server-controlled fields are set here
      const [settings] = await db
        .insert(parentSettings)
        .values({
          userId,
          pinHash,
          childName: settingsData.childName,
          readingTimeLimit: settingsData.readingTimeLimit,
          fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
          theme: settingsData.theme,
          isAdmin: isFirstUser, // First user becomes admin automatically
          trialStartedAt: now,
          trialEndsAt: trialEnd,
          subscriptionStatus: "trial",
        })
        .onConflictDoUpdate({
          target: parentSettings.userId,
          set: {
            // SECURITY: isAdmin is explicitly excluded from updates
            // to prevent privilege escalation
            pinHash,
            childName: settingsData.childName,
            readingTimeLimit: settingsData.readingTimeLimit,
            fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
            theme: settingsData.theme,
            // isAdmin is NOT updated here - admin promotion must be done server-side only
            // Trial fields are NOT updated on settings update - only set on first creation
          },
        })
        .returning();

      res.json(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
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

  // Admin check endpoint
  app.get("/api/admin/check", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      res.json({ isAdmin: settings?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
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
          trialStartedAt: now,
          trialEndsAt: trialEnd,
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

  const httpServer = createServer(app);

  return httpServer;
}
