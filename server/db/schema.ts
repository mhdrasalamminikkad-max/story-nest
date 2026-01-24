import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  summary: text("summary").notNull(),
  voiceoverUrl: text("voiceover_url"),
  pdfUrl: text("pdf_url"),
  audioUrl: text("audio_url"),
  audience: text("audience").notNull().default("both"),
  language: text("language").notNull().default("english"),
  category: text("category").notNull().default("educational"),
  storyType: text("story_type").notNull().default("lesson"),
  status: text("status").notNull().default("draft"),
  approvedBy: text("approved_by"),
  rejectionReason: text("rejection_reason"),
  coinsReward: integer("coins_reward").default(10),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  reviewedAt: integer("reviewed_at", { mode: 'timestamp' }),
  isCreatorAdmin: integer("is_creator_admin", { mode: 'boolean' }).default(false),
  isBookmarked: integer("is_bookmarked", { mode: 'boolean' }).default(false),
});

export const parentSettings = sqliteTable("parent_settings", {
  userId: text("user_id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  parentName: text("parent_name"),
  childName: text("child_name"),
  childAge: integer("child_age"),
  readingTimeLimit: integer("reading_time_limit").notNull(),
  fullscreenLockEnabled: integer("fullscreen_lock_enabled", { mode: 'boolean' }).notNull(),
  theme: text("theme").notNull(),
  isAdmin: integer("is_admin", { mode: 'boolean' }).notNull().default(false),
  isBlocked: integer("is_blocked", { mode: 'boolean' }).notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  coins: integer("coins").notNull().default(0),
  trialStartedAt: integer("trial_started_at", { mode: 'timestamp' }),
  trialEndsAt: integer("trial_ends_at", { mode: 'timestamp' }),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  activePlanId: text("active_plan_id"),
  subscriptionEndsAt: integer("subscription_ends_at", { mode: 'timestamp' }),
});

export const paymentProofs = sqliteTable("payment_proofs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  screenshotUrl: text("screenshot_url").notNull(),
  paymentDetails: text("payment_details"),
  address: text("address"),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  reviewedAt: integer("reviewed_at", { mode: 'timestamp' }),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  storyId: text("story_id").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  billingPeriod: text("billing_period").notNull(),
  stripePriceId: text("stripe_price_id"),
  features: text("features").notNull().default('[]'), // Storing array as JSON string
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  maxStories: integer("max_stories"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  startDate: integer("start_date", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  endDate: integer("end_date", { mode: 'timestamp' }),
  canceledAt: integer("canceled_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const coinSettings = sqliteTable("coin_settings", {
  id: text("id").primaryKey(),
  coinsPerStory: integer("coins_per_story").notNull().default(10),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const planCoinCosts = sqliteTable("plan_coin_costs", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  coinCost: integer("coin_cost").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const coinPackages = sqliteTable("coin_packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coins: integer("coins").notNull(),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  stripePriceId: text("stripe_price_id"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const processedPayments = sqliteTable("processed_payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id").notNull().unique(),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  coinPackageId: text("coin_package_id").notNull(),
  coinsAwarded: integer("coins_awarded").notNull(),
  processedAt: integer("processed_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const checkpoints = sqliteTable("checkpoints", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goalType: text("goal_type").notNull(),
  goalTarget: integer("goal_target").notNull(),
  rewardTitle: text("reward_title").notNull(),
  rewardDescription: text("reward_description"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const checkpointProgress = sqliteTable("checkpoint_progress", {
  id: text("id").primaryKey(),
  checkpointId: text("checkpoint_id").notNull(),
  userId: text("user_id").notNull(),
  currentProgress: integer("current_progress").notNull().default(0),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const readingSessions = sqliteTable("reading_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  storyId: text("story_id").notNull(),
  readingDate: integer("reading_date", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  badgeName: text("badge_name").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  gameType: text("game_type").notNull(),
  storyId: text("story_id").notNull(),
  earnedAt: integer("earned_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  storyId: text("story_id").notNull(),
  gameType: text("game_type").notNull(),
  score: integer("score").notNull(),
  totalScore: integer("total_score").notNull(),
  passed: integer("passed", { mode: 'boolean' }).notNull().default(false),
  playedAt: integer("played_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const storyCategories = sqliteTable("story_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const storyTypes = sqliteTable("story_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});
