import { db } from './db/index';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  try {
    console.log('🔄 Checking and creating database tables for SQLite...');

    // Create all tables using SQLite-compatible SQL
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NOT NULL,
        summary TEXT NOT NULL,
        voiceover_url TEXT,
        pdf_url TEXT,
        audio_url TEXT,
        audience TEXT NOT NULL DEFAULT 'both',
        language TEXT NOT NULL DEFAULT 'english',
        category TEXT NOT NULL DEFAULT 'educational',
        story_type TEXT NOT NULL DEFAULT 'lesson',
        status TEXT NOT NULL DEFAULT 'draft',
        approved_by TEXT,
        rejection_reason TEXT,
        coins_reward INTEGER DEFAULT 10,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        reviewed_at INTEGER,
        is_creator_admin INTEGER DEFAULT 0
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS parent_settings (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        parent_name TEXT,
        child_name TEXT,
        child_age INTEGER,
        reading_time_limit INTEGER NOT NULL DEFAULT 30,
        fullscreen_lock_enabled INTEGER NOT NULL DEFAULT 0,
        theme TEXT NOT NULL DEFAULT 'system',
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_blocked INTEGER NOT NULL DEFAULT 0,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        coins INTEGER NOT NULL DEFAULT 0,
        trial_started_at INTEGER,
        trial_ends_at INTEGER,
        subscription_status TEXT NOT NULL DEFAULT 'trial',
        active_plan_id TEXT,
        subscription_ends_at INTEGER
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        story_id TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        billing_period TEXT NOT NULL,
        stripe_price_id TEXT,
        features TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        max_stories INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        start_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        end_date INTEGER,
        canceled_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS coin_settings (
        id TEXT PRIMARY KEY,
        coins_per_story INTEGER NOT NULL DEFAULT 10,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS plan_coin_costs (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        coin_cost INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS coin_packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        coins INTEGER NOT NULL,
        price TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        stripe_price_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS processed_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        razorpay_payment_id TEXT NOT NULL UNIQUE,
        razorpay_order_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        coin_package_id TEXT NOT NULL,
        coins_awarded INTEGER NOT NULL,
        processed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        goal_type TEXT NOT NULL,
        goal_target INTEGER NOT NULL,
        reward_title TEXT NOT NULL,
        reward_description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS checkpoint_progress (
        id TEXT PRIMARY KEY,
        checkpoint_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        current_progress INTEGER NOT NULL DEFAULT 0,
        completed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        story_id TEXT NOT NULL,
        reading_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        duration_minutes INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        game_type TEXT NOT NULL,
        story_id TEXT NOT NULL,
        earned_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        story_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_score INTEGER NOT NULL,
        passed INTEGER NOT NULL DEFAULT 0,
        played_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS story_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS story_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS payment_proofs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        screenshot_url TEXT NOT NULL,
        payment_details TEXT,
        address TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        reviewed_at INTEGER
      )`);

    console.log('✅ SQLite database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}
