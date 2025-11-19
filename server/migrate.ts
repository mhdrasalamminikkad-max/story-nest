import { db } from './db/index';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  try {
    console.log('🔄 Checking and creating database tables...');
    
    // Create all tables using raw SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stories (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NOT NULL,
        summary TEXT NOT NULL,
        voiceover_url TEXT,
        language VARCHAR(20) NOT NULL DEFAULT 'english',
        category VARCHAR(30) NOT NULL DEFAULT 'educational',
        story_type VARCHAR(30) NOT NULL DEFAULT 'lesson',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        approved_by VARCHAR,
        rejection_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS parent_settings (
        user_id VARCHAR PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        reading_time_limit INTEGER NOT NULL,
        fullscreen_lock_enabled BOOLEAN NOT NULL,
        theme VARCHAR(10) NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        is_blocked BOOLEAN NOT NULL DEFAULT false,
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR,
        coins INTEGER NOT NULL DEFAULT 0,
        trial_started_at TIMESTAMP,
        trial_ends_at TIMESTAMP,
        subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial'
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        story_id VARCHAR NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        billing_period VARCHAR(20) NOT NULL,
        stripe_price_id VARCHAR,
        features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        is_active BOOLEAN NOT NULL DEFAULT true,
        max_stories INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        plan_id VARCHAR NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP,
        canceled_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coin_settings (
        id VARCHAR PRIMARY KEY,
        coins_per_story INTEGER NOT NULL DEFAULT 10,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plan_coin_costs (
        id VARCHAR PRIMARY KEY,
        plan_id VARCHAR NOT NULL,
        coin_cost INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coin_packages (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        coins INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        stripe_price_id VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS processed_payments (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        razorpay_payment_id VARCHAR NOT NULL UNIQUE,
        razorpay_order_id VARCHAR NOT NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) NOT NULL,
        coin_package_id VARCHAR NOT NULL,
        coins_awarded INTEGER NOT NULL,
        processed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checkpoints (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        goal_type VARCHAR(30) NOT NULL,
        goal_target INTEGER NOT NULL,
        reward_title TEXT NOT NULL,
        reward_description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checkpoint_progress (
        id VARCHAR PRIMARY KEY,
        checkpoint_id VARCHAR NOT NULL,
        user_id VARCHAR NOT NULL,
        current_progress INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reading_sessions (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        story_id VARCHAR NOT NULL,
        reading_date TIMESTAMP NOT NULL DEFAULT NOW(),
        duration_minutes INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}
