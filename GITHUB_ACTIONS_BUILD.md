# Tell Mamma - Automated Builds with GitHub Actions

Your Android APK builds automatically with every push to GitHub! No local setup needed.

## How It Works

1. **Push code to GitHub**
2. **GitHub Actions automatically:**
   - Installs dependencies
   - Builds web app
   - Syncs to Android
   - Builds Debug APK
   - Builds Release APK
   - Uploads as artifacts

3. **Download APK from GitHub**
   - Go to Actions tab
   - Find your build
   - Download APK artifacts

## Setup (One Time Only)

### 1. Push This Project to GitHub

```bash
git remote add origin https://github.com/YOUR-USERNAME/tell-mamma.git
git branch -M main
git push -u origin main
```

### 2. Enable Actions

- Go to GitHub repo Settings
- Click "Actions" 
- Click "Enable Actions"

That's it! Builds now happen automatically.

## Using GitHub Actions

### Download APK After Build

1. Go to your GitHub repo
2. Click **"Actions"** tab
3. Click the latest workflow run
4. Scroll down to **"Artifacts"**
5. Download `app-debug` or `app-release`

### Create Release with APK

Tag your code to create a GitHub Release with APK:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then:
1. Go to GitHub repo
2. Click **"Releases"**
3. APK is automatically attached!

## Workflow Details

The workflow file (`.github/workflows/android-build.yml`) does:

- ✅ Checks out your code
- ✅ Sets up Node.js 20
- ✅ Sets up Java 11
- ✅ Installs npm dependencies
- ✅ Builds web app (`npm run build`)
- ✅ Syncs to Android (`npx cap sync`)
- ✅ Builds debug APK (`./gradlew assembleDebug`)
- ✅ Builds release APK (`./gradlew assembleRelease`)
- ✅ Uploads both APKs as artifacts
- ✅ Creates GitHub Release on tags

## Testing on Phone

### Via GitHub Artifacts (Fastest)

1. Go to Actions > Latest run
2. Download `app-debug.apk`
3. Transfer to phone
4. Install

### Via GitHub Release (For Distribution)

1. Create a tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Go to Releases tab
3. APK is attached
4. Share release link with testers

## Publishing to Google Play

### Step 1: Get Release APK from GitHub

1. Go to Actions
2. Download `app-release` APK

### Step 2: Sign the APK

```bash
# Create keystore (one time)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.jks app-release.apk my-key-alias
```

### Step 3: Upload to Google Play

1. Create Google Play Developer account ($25)
2. Create new app
3. Upload signed APK
4. Fill in store listing
5. Submit for review

## Customizing the Workflow

Edit `.github/workflows/android-build.yml` to:

- Run on specific branches: Change `branches: [ main, master, develop ]`
- Run on schedule: Add cron trigger
- Add signing: Configure keystore in secrets
- Auto-deploy: Add Google Play upload step

## Troubleshooting

**Build fails:**
1. Check GitHub Actions log
2. Fix code locally
3. Push again - build retries automatically

**APK not downloading:**
- Make sure build succeeded (green checkmark)
- Scroll down in job details to "Artifacts" section
- Available for 90 days

**Want to build locally instead:**
- Follow `ANDROID_LOCAL_BUILD_GUIDE.md`

## Next Steps

1. Push to GitHub
2. Wait for first build (2-3 minutes)
3. Download APK from Actions
4. Test on phone!

Questions? Check GitHub Actions docs: https://docs.github.com/en/actions
