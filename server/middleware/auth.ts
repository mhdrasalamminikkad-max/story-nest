import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";
import { db } from "../db";
import { parentSettings } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check if Firebase Auth is initialized
  if (!auth) {
    console.error("❌ Firebase Admin Auth is not initialized!");
    res.status(500).json({ error: "Server configuration error - Firebase Auth not available" });
    return;
  }
  
  // Get token from Authorization header (Firebase tokens)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    // Log token for debugging
    console.log("🔑 Token header received, length:", token.length);
    console.log("🔑 Token preview:", token.substring(0, 50) + "...");
    
    // Verify Firebase ID Token
    console.log("🔐 Attempting to verify Firebase ID token...");
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("✅ Token verified successfully for user:", userId);
    
    // Store userId in request for use in route handlers
    req.userId = userId;
    
    // Check if user exists in database, if not create them
    const [existingUser] = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, userId));
    
    if (!existingUser) {
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const trialEndsAt = now + sevenDaysMs;
      
      await db.insert(parentSettings).values({
        userId: userId,
        pinHash: "",
        readingTimeLimit: 30,
        fullscreenLockEnabled: false,
        theme: "system",
        coins: 0,
        subscriptionStatus: "trial",
        trialStartedAt: now,
        trialEndsAt: trialEndsAt,
      });
    }
    
    next();
  } catch (error: any) {
    console.error("❌ Token verification error:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    res.status(401).json({ 
      error: "Invalid token",
      details: error.message,
      code: error.code
    });
  }
}

export async function checkNotBlocked(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const settings = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, req.userId))
      .limit(1);

    if (settings.length > 0 && settings[0].isBlocked) {
      res.status(403).json({ 
        error: "Account blocked", 
        message: "Your account has been blocked by an administrator. Please contact support." 
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking blocked status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
