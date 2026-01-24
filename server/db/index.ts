import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database file location (in the server directory)
const dbPath = path.join(__dirname, "..", "..", "storynest.db");

console.log(`📁 SQLite database location: ${dbPath}`);

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign keys for SQLite
sqlite.pragma("foreign_keys = ON");

// Configure WAL mode for better concurrency
sqlite.pragma("journal_mode = WAL");

console.log(`✅ Database connected successfully (SQLite)`);

export const db = drizzle(sqlite, { schema });
