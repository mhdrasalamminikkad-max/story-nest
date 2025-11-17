# StoryNest - Magical Bedtime Stories Website

A child-friendly storytelling platform with parent controls, fullscreen child mode, and text-to-speech narration.

## Project Overview

StoryNest is a fully responsive web application built with React, Express, and Firebase that helps parents find bedtime stories and children build reading habits safely online.

## Tech Stack

- **Frontend**: React + Vite, TailwindCSS, Framer Motion, Shadcn UI
- **Backend**: Express.js, Firebase Authentication, Firestore
- **Features**: Web Speech API (Read Aloud), Fullscreen API (Child Mode)
- **Fonts**: Fredoka One (headings), Poppins (body text)

## Architecture

### Frontend Structure
- `client/src/pages/` - All page components (Home, Auth, Setup, Dashboard, ChildMode)
- `client/src/components/` - Reusable components (AnimatedBackground, StoryCard, PINDialog, ThemeToggle)
- `client/src/contexts/` - React contexts (ThemeContext for Day/Night mode)
- `client/src/lib/` - Firebase client setup and API utilities

### Backend Structure
- `server/routes.ts` - API endpoints for stories, bookmarks, settings, PIN verification
- `server/firebase-admin.ts` - Firebase Admin SDK initialization
- `server/middleware/auth.ts` - JWT authentication middleware
- `server/utils/crypto.ts` - PIN hashing and verification utilities
- `shared/schema.ts` - Shared TypeScript schemas and Zod validators

## Data Models

### Story
- id, userId, title, content, imageUrl, summary, createdAt, status, rejectionReason
- User-created bedtime stories with images
- Status workflow: draft → pending_review → published (or back to draft with rejection reason)
- Only published stories appear on public feed

### Parent Settings
- userId, pinHash (hashed with PBKDF2), readingTimeLimit, fullscreenLockEnabled, theme, coins, trialStartedAt, trialEndsAt, subscriptionStatus
- Security: PINs are hashed before storage
- Trial tracking: Automatic 7-day trial activation on setup
- Subscription status: trial, active, expired

### Bookmark
- id, userId, storyId, createdAt
- Parent bookmarks for favorite stories

### Subscription Plans
- id, name, description, price, currency, billingPeriod, features, maxStories, stripePriceId, isActive, createdAt, updatedAt
- Admin-managed subscription plans for premium features
- Public API returns only user-facing fields (excludes stripePriceId, timestamps, isActive)
- PublicSubscriptionPlan type used for user-facing endpoints

### User Subscriptions
- id, userId, planId, status, startDate, endDate, canceledAt, createdAt
- Tracks user subscription status and billing periods

### Coin Packages
- id, name, description, coins, price, currency, stripePriceId, isActive, createdAt, updatedAt
- Purchasable coin packages for subscription system
- Used with Razorpay payment integration (India-compatible)

### Processed Payments
- id, userId, razorpayPaymentId (unique), razorpayOrderId, amount, currency, coinPackageId, coinsAwarded, processedAt
- Tracks all processed payments to prevent replay attacks
- Ensures idempotency - each payment can only be credited once

## User Journey

1. **Home Page** → Animated hero with floating stars and clouds
2. **Google Sign In** → Firebase Authentication
3. **Child Lock Setup** → 4-digit PIN, reading time limit, fullscreen toggle
4. **Parent Dashboard** → Add/view/bookmark stories, enter child mode
5. **Child Mode** → Fullscreen reading with text-to-speech, PIN-protected exit

## Key Features

- **Day/Night Mode**: Sunrise palette (cream, pink, sky blue) vs bedtime palette (deep blue, lavender)
- **Dreamy Animations**: Floating clouds, twinkling stars (Framer Motion)
- **Read Aloud**: Web Speech API for story narration
- **Child Lock**: Fullscreen mode with PIN-protected exit
- **Responsive Design**: Mobile-first with rounded-3xl cards and playful UI
- **Secret Admin Access**: Type "786786" and press Enter from anywhere to access admin panel
- **Story Review Workflow**: Parents submit stories for admin approval before publication

## Trial & Subscription System

### 7-Day Free Trial
- Automatically activated when users complete parent settings setup
- Countdown banner shows remaining trial days on dashboard
- After trial expires, users must purchase time-based passes to continue

### Coin-Based Subscription
- Users purchase coins via Razorpay (UPI, cards, wallets - India-compatible)
- Coins are used to redeem time-based passes:
  - **Weekly Pass**: 7 days of access
  - **Monthly Pass**: 30 days of access  
  - **Yearly Pass**: 365 days of access
- Flexible model suited for India market (no recurring payments)

### Payment Security (7-Layer Verification)
1. **HMAC Signature**: Verify Razorpay signature with SHA256
2. **API Fetch**: Fetch payment details from Razorpay server
3. **Status Check**: Only accept "captured" payments (funds secured)
4. **Order Verification**: Match order ID from client and Razorpay
5. **Replay Prevention**: Check if payment already processed
6. **Amount Verification**: Verify payment amount matches package price
7. **Audit Logging**: Comprehensive logs for all verification steps

### Subscription Middleware
- Protects routes requiring active subscription
- Returns 403 if trial expired and no active subscription
- Provides subscription info to authenticated requests

## Firebase Setup

### Required Environment Variables
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID
- `VITE_FIREBASE_API_KEY` - Your Firebase API key

### Razorpay Setup (Payment Integration)
- `RAZORPAY_KEY_ID` - Your Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay key secret

### Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add a Web app (</>)
4. Enable Authentication → Google sign-in method
5. Add authorized domains (Dev URL + deployment URL)
6. Copy credentials from "SDK setup and configuration"

## Security

- Parent PINs are hashed using PBKDF2 with 10,000 iterations
- Firebase ID tokens used for API authentication
- Firestore security rules should restrict access by userId

## Recent Changes

### November 16, 2025 (Latest)
- **Trial & Subscription System** (Production-Ready ✅):
  - Implemented 7-day free trial with auto-activation on user setup
  - Created coin-based subscription system with Razorpay payment integration
  - Built subscription page for purchasing coins and redeeming passes (weekly, monthly, yearly)
  - Added trial banner component showing remaining trial days
  - Created processedPayments table with unique constraint for replay attack prevention
  - Implemented 7-layer security verification for all payments:
    1. HMAC signature verification
    2. Razorpay API payment fetch
    3. Captured-only payment acceptance
    4. Order ID verification
    5. Duplicate payment check
    6. Amount verification
    7. Comprehensive audit logging
  - Added subscription middleware to protect routes requiring active subscription
  - **Architect approved**: All security vulnerabilities resolved, system is production-ready

- **Firebase Authentication Setup**:
  - Configured Firebase client-side authentication to use environment variables only (removed hardcoded credentials for security)
  - Added all required Firebase secrets to Replit environment (VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  - Fixed storageBucket URL to use canonical .appspot.com domain
  - Added HMR duplicate-app protection for better development experience
  - Firebase Admin SDK now properly initializes with service account credentials

- **Database Setup**:
  - Created PostgreSQL database using Replit's managed database
  - Pushed complete database schema (stories, parentSettings, bookmarks, subscriptionPlans, userSubscriptions, coinPackages, processedPayments)
  - Database is now fully operational with all tables created

- **Application Status**:
  - All authentication flows working (Google Sign-In)
  - Database operations functional
  - Admin panel accessible and working
  - Trial and subscription system fully operational
  - No LSP errors or code issues

### November 15, 2025
- **Automatic Story Approval Workflow**:
  - ALL stories (including admin-created) now automatically go to "pending_review" status
  - Stories appear in admin panel immediately for approval
  - Authors can still edit stories while they're pending review
  - Only admin-approved stories appear on public website
  - Maintains edit capability for authors to fix typos/content before admin review
  - Even admins must approve their own stories before they appear publicly

- Built complete subscription plan infrastructure:
  - Created admin panel for managing subscription plans (create, edit, activate/deactivate)
  - Implemented public pricing page (/pricing) for users to view available plans
  - Added secure public API endpoint that excludes sensitive fields (stripePriceId, timestamps)
  - Created PublicSubscriptionPlan type for safe user-facing data exposure
  - Added "Pricing" button to homepage header for easy navigation
  - Fixed security issue: public endpoint now sanitizes data to prevent leaking internal payment identifiers
  - Added default values to prevent runtime errors (features ?? [])

### Previous Updates
- Implemented story submission and review workflow (draft → pending_review → published)
- Added dual-tab Parent Dashboard (Published Stories / Your Stories)
- Created Admin Panel Story Review tab with approve/reject functionality
- Added rejection reason tracking and resubmission cycle
- Implemented secret admin code (786786 + Enter) for quick admin access
- Fixed cache invalidation for real-time status updates
- Added status guards to prevent unauthorized status changes
- Fixed schema alignment (added userId, createdAt to Story)
- Implemented PIN hashing for security
- Added proper Zod validation for all endpoints

## Development

```bash
npm run dev  # Starts both Express server (5000) and Vite dev server
```

## Notes

- Firebase Admin SDK initializes with projectId from environment
- For production, add service account credentials
- All API routes require authentication except /api/stories/preview
