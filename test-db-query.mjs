import { db } from "./server/db/index.js";
import { parentSettings } from "./server/db/schema.js";
import { sql } from "drizzle-orm";

console.log("Testing database queries...\n");

// Test 1: Direct select all
try {
    console.log("Test 1: Fetching all parent settings...");
    const allSettings = await db.select().from(parentSettings);
    console.log(`✅ Found ${allSettings.length} users`);
    console.log("Users:", allSettings.map(s => ({ userId: s.userId, is Admin: s.isAdmin })));
} catch (error) {
    console.error("❌ Error in Test 1:", error.message);
}

// Test 2: Count using PostgreSQL syntax (should fail on SQLite)
try {
    console.log("\nTest 2: Count using PostgreSQL syntax (count(*)::int)...");
    const [result] = await db
        .select({ count: sql`count(*)::int` })
        .from(parentSettings);
    console.log(`✅ Count result:`, result);
} catch (error) {
    console.error("❌ Error in Test 2 (expected on SQLite):", error.message);
}

// Test 3: Count using SQLite-compatible syntax
try {
    console.log("\nTest 3: Count using SQLite syntax (CAST(COUNT(*) AS INTEGER))...");
    const [result] = await db
        .select({ count: sql`CAST(COUNT(*) AS INTEGER)` })
        .from(parentSettings);
    console.log(`✅ Count result:`, result);
} catch (error) {
    console.error("❌ Error in Test 3:", error.message);
}

process.exit(0);
