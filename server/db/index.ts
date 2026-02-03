import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// SQLite database file path
const DATABASE_PATH = "./storynest.db";

console.log(`📁 SQLite database connecting to ${DATABASE_PATH}...`);

// Create SQLite database connection
const sqlite = new Database(DATABASE_PATH);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

console.log(`✅ Database connected successfully (SQLite)`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
