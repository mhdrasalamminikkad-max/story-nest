import { z } from "zod";

// Story Category schema
export const storyCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
});

export const insertStoryCategorySchema = storyCategorySchema.omit({
  id: true,
  createdAt: true,
});

export type StoryCategory = z.infer<typeof storyCategorySchema>;
export type InsertStoryCategory = z.infer<typeof insertStoryCategorySchema>;

// Story Type schema
export const storyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
});

export const insertStoryTypeSchema = storyTypeSchema.omit({
  id: true,
  createdAt: true,
});

export type StoryType = z.infer<typeof storyTypeSchema>;
export type InsertStoryType = z.infer<typeof insertStoryTypeSchema>;

// Story schema for bedtime stories
export const storySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  imageUrl: z.string(),
  summary: z.string(),
  voiceoverUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  audience: z.enum(["parent", "child", "both"]),
  language: z.enum(["english", "malayalam"]),
  category: z.string(),
  storyType: z.string(),
  status: z.enum(["published", "pending_review", "rejected", "draft"]),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  coinsReward: z.number().default(10),
  createdAt: z.number(),
  reviewedAt: z.number().optional(),
  isBookmarked: z.boolean().optional(),
  isCreatorAdmin: z.boolean().optional(),
});

export const insertStorySchema = storySchema.omit({ 
  id: true, 
  createdAt: true, 
  userId: true, 
  isBookmarked: true, 
  approvedBy: true,
  reviewedAt: true,
  status: true
}).extend({
  voiceoverUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  audience: z.enum(["parent", "child", "both"], { required_error: "Please select an audience" }),
  language: z.enum(["english", "malayalam"], { required_error: "Please select a language" }),
  category: z.string().min(1, "Please select a category"),
  storyType: z.string().min(1, "Please select a story type"),
});

export const reviewStorySchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
  coinsReward: z.number().min(0).optional(),
});

export type Story = z.infer<typeof storySchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type ReviewStory = z.infer<typeof reviewStorySchema>;

// Parent settings schema for child lock and preferences
export const parentSettingsSchema = z.object({
  userId: z.string(),
  pinHash: z.string(),
  parentName: z.string().optional(),
  childName: z.string().optional(),
  childAge: z.number().optional(),
  readingTimeLimit: z.number().default(30),
  fullscreenLockEnabled: z.boolean().default(false),
  theme: z.string().default("system"),
  isAdmin: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  coins: z.number().default(0),
  trialStartedAt: z.number().optional(),
  trialEndsAt: z.number().optional(),
  subscriptionStatus: z.enum(["trial", "active", "expired", "canceled"]).default("trial"),
});

export const insertParentSettingsSchema = z.object({
  pin: z.string().length(4, "PIN must be exactly 4 digits"),
  parentName: z.string().min(1, "Please enter your name").max(50, "Name is too long"),
  childName: z.string().min(1, "Please enter your child's name").max(50, "Name is too long"),
  childAge: z.number().min(1, "Child age must be at least 1").max(18, "Child age cannot exceed 18"),
  readingTimeLimit: z.number().min(10).max(60),
  fullscreenLockEnabled: z.boolean(),
  theme: z.enum(["day", "night"]),
});

export type ParentSettings = z.infer<typeof parentSettingsSchema>;
export type InsertParentSettings = z.infer<typeof insertParentSettingsSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  createdAt: z.number(),
});

export const insertBookmarkSchema = z.object({
  storyId: z.string(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

// Subscription plan schema
export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  currency: z.string(),
  billingPeriod: z.enum(["monthly", "yearly", "weekly", "lifetime"]),
  stripePriceId: z.string().optional(),
  features: z.array(z.string()),
  isActive: z.boolean(),
  maxStories: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertSubscriptionPlanSchema = subscriptionPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.number().min(0),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  maxStories: z.number().min(1).optional(),
});

export const updateSubscriptionPlanSchema = insertSubscriptionPlanSchema.partial();

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlanSchema>;

// Public subscription plan type for user-facing display (excludes internal fields)
export const publicSubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  currency: z.string(),
  billingPeriod: z.enum(["monthly", "yearly", "weekly", "lifetime"]),
  features: z.array(z.string()),
  maxStories: z.number().optional(),
});

export type PublicSubscriptionPlan = z.infer<typeof publicSubscriptionPlanSchema>;

// User subscription schema
export const userSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.enum(["active", "canceled", "expired", "pending"]),
  startDate: z.number(),
  endDate: z.number().optional(),
  canceledAt: z.number().optional(),
  createdAt: z.number(),
});

export type UserSubscription = z.infer<typeof userSubscriptionSchema>;

// Coin settings schema
export const coinSettingsSchema = z.object({
  id: z.string(),
  coinsPerStory: z.number().min(1),
  updatedAt: z.number(),
});

export const updateCoinSettingsSchema = z.object({
  coinsPerStory: z.number().min(1),
});

export type CoinSettings = z.infer<typeof coinSettingsSchema>;
export type UpdateCoinSettings = z.infer<typeof updateCoinSettingsSchema>;

// Plan coin cost schema
export const planCoinCostSchema = z.object({
  id: z.string(),
  planId: z.string(),
  coinCost: z.number().min(0),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const updatePlanCoinCostSchema = z.object({
  planId: z.string(),
  coinCost: z.number().min(0),
});

export type PlanCoinCost = z.infer<typeof planCoinCostSchema>;
export type UpdatePlanCoinCost = z.infer<typeof updatePlanCoinCostSchema>;

// Coin package schema
export const coinPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  coins: z.number().min(1),
  price: z.string(),
  currency: z.string(),
  stripePriceId: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertCoinPackageSchema = coinPackageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.number().min(0),
  coins: z.number().min(1, "Coins must be at least 1"),
});

export const updateCoinPackageSchema = insertCoinPackageSchema.partial();

export type CoinPackage = z.infer<typeof coinPackageSchema>;
export type InsertCoinPackage = z.infer<typeof insertCoinPackageSchema>;
export type UpdateCoinPackage = z.infer<typeof updateCoinPackageSchema>;

// Public coin package type for user-facing display
export const publicCoinPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  coins: z.number(),
  price: z.string(),
  currency: z.string(),
});

export type PublicCoinPackage = z.infer<typeof publicCoinPackageSchema>;

// Checkpoint schema
export const checkpointSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  goalType: z.enum(["stories_read", "reading_days", "reading_minutes"]),
  goalTarget: z.number().min(1),
  rewardTitle: z.string(),
  rewardDescription: z.string().optional(),
  status: z.enum(["active", "archived"]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertCheckpointSchema = checkpointSchema.omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  goalTarget: z.number().min(1, "Goal must be at least 1"),
  title: z.string().min(1, "Title is required"),
  rewardTitle: z.string().min(1, "Reward title is required"),
});

export type Checkpoint = z.infer<typeof checkpointSchema>;
export type InsertCheckpoint = z.infer<typeof insertCheckpointSchema>;

// Checkpoint progress schema
export const checkpointProgressSchema = z.object({
  id: z.string(),
  checkpointId: z.string(),
  userId: z.string(),
  currentProgress: z.number(),
  completedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CheckpointProgress = z.infer<typeof checkpointProgressSchema>;

// Reading session schema
export const readingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  readingDate: z.number(),
  durationMinutes: z.number(),
  createdAt: z.number(),
});

export const insertReadingSessionSchema = readingSessionSchema.omit({
  id: true,
  userId: true,
  readingDate: true,
  createdAt: true,
});

export type ReadingSession = z.infer<typeof readingSessionSchema>;
export type InsertReadingSession = z.infer<typeof insertReadingSessionSchema>;

// Badge schema
export const badgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  badgeName: z.string(),
  badgeIcon: z.string(),
  earnedAt: z.number(),
  gameType: z.enum(["quiz", "wordMatching", "memory", "drawing"]),
  storyId: z.string(),
  createdAt: z.number(),
});

export type Badge = z.infer<typeof badgeSchema>;

// Game result schema
export const gameResultSchema = z.object({
  storyId: z.string(),
  gameType: z.enum(["quiz", "wordMatching", "memory", "drawing"]),
  score: z.number(),
  totalScore: z.number(),
});

export type GameResult = z.infer<typeof gameResultSchema>;

// Game session schema
export const gameSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  gameType: z.enum(["quiz", "wordMatching", "memory", "drawing"]),
  score: z.number(),
  totalScore: z.number(),
  passed: z.boolean(),
  playedAt: z.number(),
  createdAt: z.number(),
});

export const insertGameSessionSchema = gameSessionSchema.omit({
  id: true,
  userId: true,
  playedAt: true,
  createdAt: true,
});

export type GameSession = z.infer<typeof gameSessionSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
