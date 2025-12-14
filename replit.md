# StoryNest - Magical Bedtime Stories Website

## Overview
StoryNest is a child-friendly, fully responsive web application built with React, Express, and Firebase. Its primary purpose is to provide parents with a platform to find bedtime stories and help children develop reading habits in a safe online environment. Key capabilities include parental controls, a fullscreen child mode, and text-to-speech narration. The project aims to offer a magical and engaging storytelling experience for children while providing parents with robust management tools.

## User Preferences
- PDF.js library implementation is PERMANENT - do not modify without explicit user request

## System Architecture
### Tech Stack
- **Frontend**: React + Vite, TailwindCSS, Framer Motion, Shadcn UI
- **Backend**: Express.js, Firebase Authentication, Firestore
- **Features**: Web Speech API (Read Aloud), Fullscreen API (Child Mode)
- **Fonts**: Fredoka One (headings), Poppins (body text)

### Frontend Structure
- **Pages**: `client/src/pages/` (Home, Auth, Setup, Dashboard, ChildMode)
- **Components**: `client/src/components/` (Reusable UI elements)
- **Contexts**: `client/src/contexts/` (e.g., ThemeContext for Day/Night mode)
- **Utilities**: `client/src/lib/` (Firebase client setup, API utilities)

### Backend Structure
- **API Endpoints**: `server/routes.ts` (stories, bookmarks, settings, PIN verification)
- **Firebase Admin**: `server/firebase-admin.ts`
- **Authentication**: `server/middleware/auth.ts` (JWT middleware)
- **Security Utilities**: `server/utils/crypto.ts` (PIN hashing)
- **Shared Schemas**: `shared/schema.ts` (TypeScript, Zod validators)

### UI/UX Decisions
- **Day/Night Mode**: Uses distinct "sunrise" (cream, pink, sky blue) and "bedtime" (deep blue, lavender) palettes.
- **Animations**: Dreamy aesthetics with floating clouds and twinkling stars using Framer Motion.
- **Responsiveness**: Mobile-first design with rounded-3xl cards and a playful UI.

### Feature Specifications
- **Child Lock**: Fullscreen mode with PIN-protected exit.
- **Read Aloud**: Integrates Web Speech API for story narration.
- **Story Review Workflow**: Parents submit stories for admin approval (draft → pending_review → published). Only published stories are public.
- **Post-Story Games**: Four interactive game types (Quiz, Word Matching, Memory, Drawing Puzzle) with scores, badges, and age-appropriate difficulty. Games are optional for parents but compulsory for children before changing stories.
- **Leaderboard System**: Hall of Fame for top children (by badges) and top parents (by published stories).
- **Trial & Subscription**: 7-day free trial, followed by a coin-based subscription model. Users purchase coins (via Razorpay) to redeem weekly, monthly, or yearly passes.
- **Secret Admin Access**: Type "786786" anywhere to access the admin panel.

### System Design Choices
- **Data Models**: Comprehensive models for Story, Parent Settings, Bookmark, Subscription Plans, User Subscriptions, Coin Packages, Processed Payments, Game Sessions, and Badges.
- **Security**: PINs hashed with PBKDF2 (10,000 iterations), Firebase ID tokens for authentication, Firestore security rules. Payment security includes a 7-layer verification process for Razorpay transactions.
- **Subscription Middleware**: Protects routes requiring an active subscription, returning 403 if the trial is expired or no active subscription exists.

## Recent Changes (December 14, 2025)
- Completed full migration import (363 tasks)
- Firebase Admin credentials configured and working
- All packages installed and application running on port 5000
- Progress tracked in `.local/state/replit/agent/progress_tracker.md`

## External Dependencies
- **Firebase**: Authentication (Google Sign-In), Firestore (database), Firebase Admin SDK.
  - Frontend env vars: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
  - Backend secrets (configured): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **Razorpay**: Payment gateway for coin purchases (supports UPI, cards, wallets in India).
  - Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- **Web Speech API**: For text-to-speech narration.
- **Fullscreen API**: For child mode functionality.
- **PDF.js**: For PDF rendering (uses local worker file from `pdfjs-dist` package).