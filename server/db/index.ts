import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://tellmamma_user:hz8AGCHI31lctLaGaXc4l4wI1uAO90vt@dpg-d4vvhi1r0fns739u6ahg-a.virginia-postgres.render.com/tellmamma";

// Configure pool with SSL/TLS for Render PostgreSQL
const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates from Render
  },
});

export const db = drizzle(pool, { schema });
