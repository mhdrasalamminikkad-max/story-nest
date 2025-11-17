import { z } from "zod";

// Story schema for bedtime stories
export const storySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  imageUrl: z.string(),
  summary: z.string(),
  voiceoverUrl: z.string().optional(),
  language: z.enum(["english", "malayalam"]),
  category: z.enum(["islamic", "history", "moral", "adventure", "educational", "fairy-tale"]),
  storyType: z.enum(["islamic", "lesson", "history", "fairy-tale", "adventure", "educational", "moral", "mythology", "science"]),
  status: z.enum(["published", "pending_review", "rejected", "draft"]),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.number(),
  reviewedAt: z.number().optional(),
  isBookmarked: z.boolean().optional(),
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
  language: z.enum(["english", "malayalam"], { required_error: "Please select a language" }),
  category: z.enum(["islamic", "history", "moral", "adventure", "educational", "fairy-tale"], { required_error: "Please select a category" }),
  storyType: z.enum(["islamic", "lesson", "history", "fairy-tale", "adventure", "educational", "moral", "mythology", "science"], { required_error: "Please select a story type" }),
});

export const reviewStorySchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

export type Story = z.infer<typeof storySchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type ReviewStory = z.infer<typeof reviewStorySchema>;

// Parent settings schema for child lock and preferences
export const parentSettingsSchema = z.object({
  userId: z.string(),
  pinHash: z.string(),
  readingTimeLimit: z.number().min(10).max(60),
  fullscreenLockEnabled: z.boolean(),
  theme: z.enum(["day", "night"]),
  isAdmin: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  coins: z.number().default(0),
  trialStartedAt: z.number().optional(),
  trialEndsAt: z.number().optional(),
  subscriptionStatus: z.enum(["trial", "active", "expired", "canceled"]).default("trial"),
});

export const insertParentSettingsSchema = z.object({
  pin: z.string().length(4),
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
