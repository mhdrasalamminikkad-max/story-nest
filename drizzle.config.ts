import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./storynest.db",
  },
});
