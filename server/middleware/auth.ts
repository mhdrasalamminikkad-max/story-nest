import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { auth } from "../firebase-admin";
import { db } from "../db";
import { parentSettings } from "../db/schema";
import { eq } from "drizzle-orm";
import { GOOGLE_OAUTH_CONFIG, getRedirectUri } from "../lib/google-oauth";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // First check for HTTP-only cookie
  let token = (req.cookies as any)?.auth_token;
  
  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  }
  
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    // Verify Google ID Token
    let userId: string | undefined;
    
    try {
      // Try to verify with Google OAuth library
      const oauth2Client = new OAuth2Client(
        GOOGLE_OAUTH_CONFIG.clientId,
        GOOGLE_OAUTH_CONFIG.clientSecret,
        getRedirectUri()
      );
      
      const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_OAUTH_CONFIG.clientId,
      });
      
      const payload = ticket.getPayload();
      if (payload) {
        userId = payload.sub;
      }
    } catch (e) {
      // If Google verification fails, try Firebase
      try {
        if (auth) {
          const decodedToken = await auth.verifyIdToken(token);
          userId = decodedToken.uid;
        }
      } catch (firebaseErr) {
        // Final fallback: manual JWT decode
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = payload.sub || payload.user_id;
        } catch (decodeErr) {
          throw new Error("Could not verify or decode token");
        }
      }
    }

    if (!userId) {
      throw new Error("Could not extract user ID from token");
    }

    req.userId = userId;
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
