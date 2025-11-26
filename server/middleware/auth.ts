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
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    if (!auth) {
      console.error("Firebase Admin not initialized");
      res.status(500).json({ error: "Authentication service unavailable" });
      return;
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid token" });
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
