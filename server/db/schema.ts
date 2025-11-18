import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  summary: text("summary").notNull(),
  voiceoverUrl: text("voiceover_url"),
  language: varchar("language", { length: 20 }).notNull().default("english"),
  category: varchar("category", { length: 30 }).notNull().default("educational"),
  storyType: varchar("story_type", { length: 30 }).notNull().default("lesson"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  approvedBy: varchar("approved_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
});

export const parentSettings = pgTable("parent_settings", {
  userId: varchar("user_id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  readingTimeLimit: integer("reading_time_limit").notNull(),
  fullscreenLockEnabled: boolean("fullscreen_lock_enabled").notNull(),
  theme: varchar("theme", { length: 10 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  coins: integer("coins").notNull().default(0),
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).notNull().default("trial"),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  storyId: varchar("story_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  billingPeriod: varchar("billing_period", { length: 20 }).notNull(),
  stripePriceId: varchar("stripe_price_id"),
  features: text("features").array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  maxStories: integer("max_stories"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  planId: varchar("plan_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull().default(sql`now()`),
  endDate: timestamp("end_date"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const coinSettings = pgTable("coin_settings", {
  id: varchar("id").primaryKey(),
  coinsPerStory: integer("coins_per_story").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const planCoinCosts = pgTable("plan_coin_costs", {
  id: varchar("id").primaryKey(),
  planId: varchar("plan_id").notNull(),
  coinCost: integer("coin_cost").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const coinPackages = pgTable("coin_packages", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coins: integer("coins").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  stripePriceId: varchar("stripe_price_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const processedPayments = pgTable("processed_payments", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id").notNull().unique(),
  razorpayOrderId: varchar("razorpay_order_id").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  coinPackageId: varchar("coin_package_id").notNull(),
  coinsAwarded: integer("coins_awarded").notNull(),
  processedAt: timestamp("processed_at").notNull().default(sql`now()`),
});

export const checkpoints = pgTable("checkpoints", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goalType: varchar("goal_type", { length: 30 }).notNull(),
  goalTarget: integer("goal_target").notNull(),
  rewardTitle: text("reward_title").notNull(),
  rewardDescription: text("reward_description"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const checkpointProgress = pgTable("checkpoint_progress", {
  id: varchar("id").primaryKey(),
  checkpointId: varchar("checkpoint_id").notNull(),
  userId: varchar("user_id").notNull(),
  currentProgress: integer("current_progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const readingSessions = pgTable("reading_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  storyId: varchar("story_id").notNull(),
  readingDate: timestamp("reading_date").notNull().default(sql`now()`),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});
