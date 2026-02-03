# Deployment Guide for Render

## Overview
This application is configured to run on a single port in production, serving both the API and the static frontend files. This is the correct setup for Render deployment.

## How It Works

### Development Mode (Local)
- **Vite Dev Server**: Runs on `http://localhost:5173`
- **Express API Server**: Runs on `http://localhost:5000`
- **Proxy**: Vite proxies `/api/*` requests to the Express server
- You run two separate commands: `npm run dev:client` and `npm run dev:server`

### Production Mode (Render)
- **Single Server**: Express serves both API and static files on one port (default: 5000)
- **No Proxy Needed**: Frontend makes requests to `/api/*` which are handled by the same server
- Render runs: `npm run build` then `npm start`

## Render Configuration

### 1. Build Command
```bash
npm run build
```

This command:
1. Installs dependencies with `npm install --legacy-peer-deps`
2. Builds the frontend with `vite build` → outputs to `dist/public`
3. Bundles the backend with `esbuild` → outputs to `dist/index.js`

### 2. Start Command
```bash
npm start
```

This runs: `NODE_ENV=production node dist/index.js`

The server will:
- Serve API routes at `/api/*`
- Serve static frontend files from `dist/public`
- Listen on the port specified by Render's `PORT` environment variable

### 3. Environment Variables on Render

Make sure to set these in your Render dashboard:

**Required:**
- `NODE_ENV` = `production`
- `DATABASE_URL` = Your database connection string (if using external DB)

**Optional (if using Firebase):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

**Optional (if using Stripe):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Issue: "Cannot GET /api/..."
**Cause**: API routes not registered or server not starting
**Solution**: Check Render logs for startup errors

### Issue: Blank page or 404 on routes
**Cause**: Frontend routing not configured for SPA
**Solution**: Already handled by `serveStatic` in `server/vite.ts`

### Issue: "Failed to fetch" errors
**Cause**: Frontend trying to call wrong API URL
**Solution**: Ensure all API calls use relative paths like `/api/...` (not `http://localhost:5000/api/...`)

### Issue: Database errors
**Cause**: SQLite file not persisted or wrong database config
**Solution**: 
- For SQLite: Use Render's persistent disk
- Or switch to PostgreSQL for production (recommended)

## Verifying Deployment

After deploying to Render:

1. **Check Build Logs**: Ensure `npm run build` completes successfully
2. **Check Runtime Logs**: Look for "serving on port XXXX"
3. **Test API**: Visit `https://your-app.onrender.com/api/stories` (should return JSON)
4. **Test Frontend**: Visit `https://your-app.onrender.com` (should show your app)
5. **Test Child Mode**: Navigate to `/child` and test fullscreen functionality

## Production vs Development Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Ports | 5173 (Vite) + 5000 (API) | Single port (from env) |
| Proxy | Vite proxy | No proxy needed |
| Hot Reload | ✅ Yes | ❌ No |
| Build | On-the-fly | Pre-built |
| Static Files | Served by Vite | Served by Express |

## Child Mode Fullscreen on Render

The child mode fullscreen functionality should work the same on Render as it does locally:

1. **Web Browser**: Uses Fullscreen API with aggressive polling
2. **Electron**: Not applicable for web deployment
3. **Android**: Requires building and deploying the APK separately

The fullscreen lock will work in modern browsers that support the Fullscreen API.

## Maximum Security: Using Kiosk Launcher in Production

For the "100% Lock" experience (hiding address bar, close buttons, taskbar), users cannot just visit the website in a normal browser tab. They should use a **Kiosk Launcher**.

**How parents can set this up:**
1. Create a shortcut (or `.bat` file) on their computer.
2. Point it to your Render URL with `--kiosk` flags.

**Example Production Launcher Script:**
```batch
@echo off
:: Replace with your actual Render URL
set "APP_URL=https://story-nest.onrender.com/child-fun-zone"

start chrome.exe --kiosk "%APP_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run
```

**Note:** The web-based "Soft Lock" (Logic Trap) will still work for everyone visiting the URL normally, preventing most accidental exits. The Kiosk Launcher is for the "Hard Lock" experience.

## Next Steps

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Set the build and start commands as shown above
4. Add environment variables
5. Deploy!

Your app should now work exactly as it does locally, but on a public URL.
