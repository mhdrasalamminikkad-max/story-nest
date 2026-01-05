# Child Mode Integration Guide

## Overview

Child Mode is a strict non-exitable mode that locks the application when activated. It works on:
- **Android** (WebView with Lock Task Mode)
- **PC** (Electron with kiosk mode)
- **Web** (fallback mode - limited security)

## Files Modified/Created

### React/Next.js
- `client/src/hooks/useChildMode.ts` - Native bridge hook
- `client/src/pages/ChildMode.tsx` - New Child Mode entry page
- `client/src/pages/ChildModeSelectionPage.tsx` - Updated with lock
- `client/src/pages/ChildModeReadPage.tsx` - Updated with lock
- `client/src/App.tsx` - Added `/child` route

### Android
- `android/app/src/main/java/com/tellmamma/app/MainActivity.java` - Lock Task Mode support
- `android/app/src/main/AndroidManifest.xml` - Lock task permission

### Electron
- `electron/main.js` - Main process with kiosk mode
- `electron/preload.js` - IPC bridge
- `electron/package.json` - Electron dependencies

## Usage

### Access Child Mode
Navigate to `/child` or `/child-mode` routes. The lock activates automatically on mount.

### Exit Child Mode
1. Click "Exit Child Mode" button
2. Enter parent password: `1234` (placeholder)
3. App unlocks and returns to dashboard

## Security Notes

⚠️ **PRODUCTION REQUIREMENTS:**
- Replace placeholder password `"1234"` with secure authentication
- Use encrypted storage for password validation
- Implement proper password hashing/verification
- Consider biometric authentication for enhanced security

### Where to Update Password Validation:

1. **Android**: `MainActivity.java` - `ChildModeInterface.exitChildMode()`
2. **Electron**: `electron/main.js` - `validatePassword()` function
3. **Web**: `useChildMode.ts` - Web fallback (remove in production)

## Android Setup

1. Build the app normally
2. Lock Task Mode requires device owner or kiosk app setup
3. For testing, use: `adb shell dpm set-device-owner com.tellmamma.app/.MainActivity`

## Electron Setup

1. Install dependencies: `cd electron && npm install`
2. Run: `npm run dev` (development) or `npm start` (production)
3. Ensure `dist/public` is built before running production

## Testing

- **Web**: Navigate to `/child` - keyboard shortcuts blocked, but no native lock
- **Android**: Requires device owner mode for full Lock Task Mode
- **Electron**: Full kiosk mode with Alt+F4 blocking

