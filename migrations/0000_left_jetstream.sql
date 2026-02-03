CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_name` text NOT NULL,
	`badge_icon` text NOT NULL,
	`game_type` text NOT NULL,
	`story_id` text NOT NULL,
	`earned_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`story_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkpoint_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`checkpoint_id` text NOT NULL,
	`user_id` text NOT NULL,
	`current_progress` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`goal_type` text NOT NULL,
	`goal_target` integer NOT NULL,
	`reward_title` text NOT NULL,
	`reward_description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coin_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`coins` integer NOT NULL,
	`price` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`stripe_price_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coin_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`coins_per_story` integer DEFAULT 10 NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`story_id` text NOT NULL,
	`game_type` text NOT NULL,
	`score` integer NOT NULL,
	`total_score` integer NOT NULL,
	`passed` integer DEFAULT false NOT NULL,
	`played_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parent_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`pin_hash` text NOT NULL,
	`parent_name` text,
	`child_name` text,
	`child_age` integer,
	`reading_time_limit` integer NOT NULL,
	`fullscreen_lock_enabled` integer NOT NULL,
	`theme` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_blocked` integer DEFAULT false NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`coins` integer DEFAULT 0 NOT NULL,
	`trial_started_at` integer,
	`trial_ends_at` integer,
	`subscription_status` text DEFAULT 'trial' NOT NULL,
	`active_plan_id` text,
	`subscription_ends_at` integer
);
--> statement-breakpoint
CREATE TABLE `payment_proofs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`screenshot_url` text NOT NULL,
	`payment_details` text,
	`address` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE TABLE `plan_coin_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`coin_cost` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `processed_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`razorpay_payment_id` text NOT NULL,
	`razorpay_order_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`coin_package_id` text NOT NULL,
	`coins_awarded` integer NOT NULL,
	`processed_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `processed_payments_razorpay_payment_id_unique` ON `processed_payments` (`razorpay_payment_id`);--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`story_id` text NOT NULL,
	`reading_date` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`duration_minutes` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`image_url` text NOT NULL,
	`summary` text NOT NULL,
	`voiceover_url` text,
	`pdf_url` text,
	`audio_url` text,
	`audience` text DEFAULT 'both' NOT NULL,
	`language` text DEFAULT 'english' NOT NULL,
	`category` text DEFAULT 'educational' NOT NULL,
	`story_type` text DEFAULT 'lesson' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_by` text,
	`rejection_reason` text,
	`coins_reward` integer DEFAULT 10,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`reviewed_at` integer,
	`is_creator_admin` integer DEFAULT false,
	`is_bookmarked` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `story_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `story_categories_slug_unique` ON `story_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `story_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `story_types_slug_unique` ON `story_types` (`slug`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`billing_period` text NOT NULL,
	`stripe_price_id` text,
	`features` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`max_stories` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`end_date` integer,
	`canceled_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
