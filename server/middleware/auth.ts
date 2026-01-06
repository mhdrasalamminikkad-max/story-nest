import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { parentSettings } from "../db/schema";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_OAUTH_CONFIG } from "../lib/google-oauth";

export interface AuthRequest extends Request {
  userId?: string;
}

// Initialize OAuth2Client for token verification
const oauth2Client = new OAuth2Client(GOOGLE_OAUTH_CONFIG.clientId);

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
    // Verify Google ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_OAUTH_CONFIG.clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }
    
    // Use Google user ID (sub claim) as userId
    req.userId = payload.sub;
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
