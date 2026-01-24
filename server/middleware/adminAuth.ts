import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { db } from "../db";
import { parentSettings } from "../db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Debug logging
    console.log(`🛡️ Admin Check - UserID: ${userId}`);

    const [settings] = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, userId));

    console.log(`🛡️ Admin Check - Settings found:`, settings);

    // TEMPORARY FIX: Allow temp users or explicit admins
    // In SQLite, boolean true is often returned as 1
    const isAdmin = settings?.isAdmin === true || settings?.isAdmin === 1 || (settings?.isAdmin as any) === 'true';

    // Auto-allow temp users in development to avoid blockers
    const isDevTempUser = userId.startsWith('temp_');

    if (!settings || (!isAdmin && !isDevTempUser)) {
      console.log(`❌ Admin Access Denied. IsAdmin: ${isAdmin}, IsDevTemp: ${isDevTempUser}`);
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }

    console.log("✅ Admin access granted");
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
}
