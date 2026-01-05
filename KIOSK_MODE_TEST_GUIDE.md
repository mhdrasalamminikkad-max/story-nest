# Kiosk Mode Testing Guide

## Overview
The kiosk mode implementation provides a secure, non-exitable child mode across three platforms:
- **Electron** (PC Desktop)
- **Android** (Mobile via Capacitor)
- **Web** (Browser fallback)

## Architecture

### Electron (Windows/Mac/Linux Desktop)
- **Main Process**: `electron/main.js`
- **IPC Bridge**: `electron/preload.js`
- **Features**: Kiosk mode, fullscreen, global shortcut blocking, window control
- **Password**: "1234" (demo)

### Android (Mobile)
- **Native Plugin**: `android/app/src/main/java/com/tellmamma/app/plugins/ChildModePlugin.java`
- **Features**: Lock Task Mode, back button blocking, system UI hiding
- **Password**: "1234" (demo)

### Web/React
- **Components**: 
  - `client/src/pages/ChildMode.tsx` (Entry page)
  - `client/src/pages/ChildModeSelectionPage.tsx` (Story selection)
  - `client/src/pages/ChildModeReadPage.tsx` (Story reading)
- **Features**: Fullscreen API, keyboard blocking, history manipulation, user interaction handlers

---

## Testing on Electron (PC Desktop)

### Prerequisites
```bash
# Install dependencies
npm install

# Install Electron globally (optional)
npm install -g electron
```

### Setup (3 Terminal Windows)

**Terminal 1 - Start Backend Server:**
```bash
npm run dev:server
# Listens on: http://localhost:3000
```

**Terminal 2 - Start React Dev Server:**
```bash
npm run dev:client
# Listens on: http://localhost:5000
```

**Terminal 3 - Start Electron:**
```bash
npm run electron-dev
# Loads: http://localhost:5000 in Electron window
```

### Testing Steps

#### 1. **Enter Child Mode**
- Click "Enter Magic World" button
- Expected:
  ✅ Window goes fullscreen
  ✅ Window controls disappear
  ✅ Dev tools close (if open)
  ✅ Console shows: `[Electron] Kiosk mode enabled`
  ✅ Console shows: `[Electron] Fullscreen enabled`
  ✅ Console shows: `[ChildMode] Electron kiosk mode activated`

#### 2. **Test Keyboard Blocking**
In child mode, try pressing:
- **ESC** → ✅ Blocked, console: `[Electron] Escape blocked`
- **Alt+F4** → ✅ Blocked, console: `[Electron] Alt+F4 blocked`
- **Ctrl+Q** → ✅ Blocked, console: `[Electron] Ctrl+Q blocked`
- **Ctrl+W** → ✅ Blocked, console: `[Electron] Ctrl+W blocked`
- **F11** → ✅ Blocked, console: `[Electron] F11 blocked`
- **F12** → ✅ Blocked, console: `[Electron] F12 blocked`
- **Ctrl+Shift+I** (DevTools) → ✅ Blocked

#### 3. **Test Window Controls**
- Try closing window → ✅ Window won't close
- Click X button → ✅ No effect
- Try quitting app → ✅ Blocked, console: `[Electron] Quit blocked - Child Mode is active`

#### 4. **Test Web Layer Protections**
While in fullscreen:
- Press **ESC** → ✅ Fullscreen re-entered (polling detects loss)
- Browser back button → ✅ History API prevents navigation

#### 5. **Exit Child Mode**
- Scroll down to "Exit Child Mode" button (red button)
- Enter password: **1234**
- Click "Unlock and Return to Dashboard"
- Expected:
  ✅ Window exits fullscreen
  ✅ Kiosk mode disabled
  ✅ Window controls return
  ✅ Can close window again
  ✅ Console shows: `[Electron] Kiosk mode disabled`
  ✅ Redirects to `/dashboard`

#### 6. **Test Invalid Password**
- Click "Exit Child Mode" button
- Enter wrong password (e.g., "0000")
- Click "Unlock and Return to Dashboard"
- Expected:
  ✅ Error message: "Invalid password"
  ✅ Still in child mode
  ✅ Window still fullscreen
  ✅ Cannot exit

---

## Testing on Android (Mobile)

### Prerequisites
- Android device or emulator
- APK built with `ionic build android`
- Lock Task Mode requires device owner setup (development mode)

### Setup

**Option 1: Using Lock Task Mode (Full Security)**
```bash
# Set as device owner
adb shell dpm set-device-owner com.tellmamma.app/.MainActivity

# Install APK
adb install -r app-release.apk
```

**Option 2: Testing Without Device Owner**
- Lock Task Mode won't activate, but web protections still work
- App will still block back button and keyboard

### Testing Steps

#### 1. **Open Child Mode**
- Navigate to `/child` route
- Click "Enter Magic World"
- Expected:
  ✅ App goes fullscreen
  ✅ System UI hidden (if device owner)
  ✅ Status bar hidden
  ✅ Back button disabled
  ✅ Home button disabled (if device owner)
  ✅ Recents disabled (if device owner)

#### 2. **Test Back Button**
- Press Android back button → ✅ Blocked, app stays fullscreen
- No navigation occurs

#### 3. **Test App Resume**
- Press home button → ✅ App minimized
- Switch to another app → ✅ App backgrounded
- Tap app in recents/return to app → ✅ Fullscreen re-enforced
  - Console shows: `[Child Mode] App resumed - re-enforcing fullscreen trap...`

#### 4. **Test Browser Back**
- In web version, click back → ✅ History API prevents navigation
- Console shows: `Browser back prevented`

#### 5. **Exit Child Mode**
- Scroll to red "Exit Child Mode" button
- Enter password: **1234**
- Click unlock
- Expected:
  ✅ Exits fullscreen
  ✅ System UI returns
  ✅ Back button works again
  ✅ Home button works again
  ✅ Navigates to dashboard

---

## Testing on Web Browser (Mobile Chrome/Safari)

### Setup
```bash
# Start dev server
npm run dev:client

# On mobile device, visit:
# http://<your-computer-ip>:5000
```

### Testing Steps

#### 1. **Enter Child Mode**
- Click "Enter Magic World"
- Expected:
  ✅ Page goes fullscreen (if browser supports)
  ✅ Fullscreen trap activates
  ✅ Keyboard blocking active

#### 2. **Test Browser Back**
- Click mobile browser back button → ✅ Blocked
- History API prevents navigation
- Page stays on same URL

#### 3. **Test Fullscreen Trap**
- While in fullscreen, press **ESC** → ✅ Auto-re-enters fullscreen
- Console shows: `Fullscreen lost! Forcing re-entry...`
- 50ms polling checks state continuously

#### 4. **Test Screen Area Detection**
- If window shrinks (browser UI appears) → ✅ Auto-fullscreen
- Console shows: `Screen area reduced from X to Y - Forcing fullscreen!`

#### 5. **Exit Child Mode**
- Scroll to red button
- Enter: **1234**
- Expected:
  ✅ Exits fullscreen
  ✅ Returns to dashboard
  ✅ Back button works again

---

## Console Debugging

### Enable Console Logs
All actions log to browser/app console with prefixes:
- `[Child Mode]` - React layer
- `[Child Mode Selection]` - Selection page
- `[Child Mode Read]` - Reading page
- `[Electron]` - Electron main process
- `[Android]` - Native Android code

### Monitoring Child Mode
Open DevTools (before entering child mode):
```javascript
// Check if in child mode
console.log(window.electron?.ipcRenderer);  // Should exist on Electron
console.log(window.childMode);              // Should exist on Android
console.log(window.androidChildMode);       // Android fallback
```

### Testing IPC Communication
```javascript
// Manually trigger enter
window.electron?.ipcRenderer.invoke('enter-child-mode');

// Manually trigger exit with password
window.electron?.ipcRenderer.invoke('exit-child-mode', '1234');
```

---

## Protection Layers Summary

### Layer 1: Native Platform (Strongest)
- **Electron**: Kiosk mode + global shortcuts
- **Android**: Lock Task Mode + back button interception

### Layer 2: Browser/Web (Strong)
- **Fullscreen API**: Browser fullscreen mode
- **Keyboard**: Event listeners with preventDefault
- **History**: pushState manipulation

### Layer 3: User Interaction (Intermediate)
- **Automatic fullscreen**: On any click/touch
- **Screen area detection**: Detects ESC/F11 exits
- **50ms polling**: Continuous state monitoring
- **Visibility/Focus**: Re-enters on tab switch

### Layer 4: Fallback (Moderate)
- **beforeunload**: Prevents page unload
- **unload**: Blocks navigation
- **Context menu**: Prevents right-click

---

## Known Limitations

### ESC and F11 Keys
- **Why**: Browser reserves these for user control
- **Solution**: Polling detects exit and automatically re-enters
- **Behavior**: Momentary exit → immediate re-entry (user sees flash)

### Screen Exit Detection
- **Why**: Some browsers don't reliably fire exit events
- **Solution**: 50ms polling checks `!document.fullscreenElement`
- **Limitation**: Small lag between exit and re-entry

### Mobile Browser (Web)
- **No native lock**: Browser-level restrictions don't apply
- **Depends on**: Fullscreen trap + user interaction
- **Best for**: Light supervision (not secure against determined users)

### Android without Device Owner
- **No Lock Task Mode**: Back button and home still accessible
- **Partial security**: Web layer protections still active
- **Setup required**: Device owner mode for full security

---

## Password Management

### Current Implementation
```
Demo Password: "1234"
Location: electron/main.js (line ~140)
Location: android/ChildModePlugin.java (line ~70)
```

### Production Requirements
⚠️ **BEFORE RELEASE:**

1. **Replace hardcoded password** with secure authentication:
   ```javascript
   // electron/main.js
   function validatePassword(password) {
     // TODO: Use secure password hashing
     // TODO: Check against encrypted storage
     // TODO: Implement rate limiting
     // TODO: Add biometric support
   }
   ```

2. **Android Security**:
   - Use SharedPreferences with encryption
   - Implement password hashing (bcrypt)
   - Add failed attempt tracking

3. **Web Security**:
   - Verify password on backend API
   - Use HTTPS only
   - Implement session tokens

---

## Troubleshooting

### Electron Won't Enter Kiosk
- ✅ Check console for `[Electron] Kiosk mode enabled`
- ✅ Verify `npm run electron-dev` is running
- ✅ Ensure http://localhost:5000 is accessible
- ✅ Try restarting Electron

### Keyboard Still Working
- ✅ Make sure you're in child mode (fullscreen + no window controls)
- ✅ Check console for `[Electron] XXX blocked` messages
- ✅ Try different key combinations

### Can't Exit Child Mode
- ✅ Verify password is "1234" (case-sensitive)
- ✅ Check console for password validation errors
- ✅ Try closing Electron entirely and restarting

### Mobile App Won't Lock
- ✅ Device owner not set → Lock Task Mode won't work
- ✅ Use `adb shell dpm set-device-owner ...` command
- ✅ Web protections still work even without device owner

### Fullscreen Won't Exit ESC
- ✅ This is expected behavior (browser security)
- ✅ ESC triggers exit, fullscreen polling detects and re-enters
- ✅ Should appear as brief fullscreen flash

---

## Success Criteria ✅

### Electron
- [ ] Window goes fullscreen with no controls
- [ ] All keyboard shortcuts blocked
- [ ] Window won't close
- [ ] Valid password exits correctly
- [ ] Invalid password shows error
- [ ] App cannot be quit while in child mode

### Android
- [ ] Back button doesn't navigate
- [ ] Fullscreen activates
- [ ] Status bar disappears (with device owner)
- [ ] Password exits correctly
- [ ] App resume re-enforces fullscreen

### Web
- [ ] Browser back button blocked
- [ ] ESC momentarily exits then re-enters fullscreen
- [ ] User interaction triggers fullscreen re-entry
- [ ] Screen area reduction triggers fullscreen
- [ ] Valid password exits to dashboard

---

## Report Issues

When testing, report any of these:
1. Console errors
2. Unexpected behavior
3. UI glitches during transitions
4. Password validation failures
5. Keyboard shortcuts working when blocked
6. Fullscreen not activating

Check the browser/Electron console for detailed error messages with `[Child Mode]` prefix.
