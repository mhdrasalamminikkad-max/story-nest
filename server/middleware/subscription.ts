import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { db } from "../db";
import { parentSettings, userSubscriptions } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface SubscriptionRequest extends AuthRequest {
  subscriptionInfo?: {
    status: 'trial' | 'active' | 'expired' | 'canceled';
    trialDaysRemaining?: number;
    hasActivePass: boolean;
    activePassEndDate?: number;
  };
}

export async function checkSubscriptionStatus(
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [userSettings] = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, userId));

    if (!userSettings) {
      return res.status(404).json({ error: "User settings not found" });
    }

    if (userSettings.isAdmin) {
      req.subscriptionInfo = {
        status: 'active',
        hasActivePass: true,
      };
      return next();
    }

    const now = Date.now();
    let trialDaysRemaining = 0;
    let hasActivePass = false;
    let activePassEndDate: number | undefined;

    if (userSettings.trialStartedAt && userSettings.trialEndsAt) {
      const trialEnd = userSettings.trialEndsAt.getTime();
      if (now < trialEnd) {
        trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        req.subscriptionInfo = {
          status: 'trial',
          trialDaysRemaining,
          hasActivePass: true,
        };
        return next();
      }
    }

    const [latestSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    if (latestSubscription && latestSubscription.endDate) {
      const endDate = latestSubscription.endDate.getTime();
      if (now < endDate && latestSubscription.status === 'active') {
        hasActivePass = true;
        activePassEndDate = endDate;
        req.subscriptionInfo = {
          status: 'active',
          hasActivePass: true,
          activePassEndDate,
        };
        return next();
      }
    }

    req.subscriptionInfo = {
      status: 'expired',
      hasActivePass: false,
      trialDaysRemaining: 0,
    };

    return res.status(402).json({
      error: "Subscription required",
      message: "Your trial has expired. Please purchase a subscription to continue.",
      subscriptionInfo: req.subscriptionInfo,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({ error: "Failed to check subscription status" });
  }
}

export async function getSubscriptionInfo(
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [userSettings] = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, userId));

    if (!userSettings) {
      return res.status(404).json({ error: "User settings not found" });
    }

    if (userSettings.isAdmin) {
      req.subscriptionInfo = {
        status: 'active',
        hasActivePass: true,
      };
      return next();
    }

    const now = Date.now();
    let trialDaysRemaining = 0;
    let hasActivePass = false;
    let activePassEndDate: number | undefined;
    let status: 'trial' | 'active' | 'expired' | 'canceled' = 'expired';

    if (userSettings.trialStartedAt && userSettings.trialEndsAt) {
      const trialEnd = userSettings.trialEndsAt.getTime();
      if (now < trialEnd) {
        trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        status = 'trial';
        hasActivePass = true;
      }
    }

    const [latestSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    if (latestSubscription && latestSubscription.endDate) {
      const endDate = latestSubscription.endDate.getTime();
      if (now < endDate && latestSubscription.status === 'active') {
        hasActivePass = true;
        activePassEndDate = endDate;
        status = 'active';
      }
    }

    req.subscriptionInfo = {
      status,
      trialDaysRemaining,
      hasActivePass,
      activePassEndDate,
    };

    next();
  } catch (error) {
    console.error("Subscription info error:", error);
    return res.status(500).json({ error: "Failed to get subscription info" });
  }
}
