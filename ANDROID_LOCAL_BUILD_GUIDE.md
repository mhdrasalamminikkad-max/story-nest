# Tell Mamma - Build Android APK Locally

Your Android project is ready to build on your computer. Follow these steps:

## Step 1: Download the Android Folder

Download the entire `android` folder from your Replit project:
- File path: `/android`
- Contains: Full Android project with Gradle configuration

You also need these files from the root:
- `capacitor.config.ts` (copy to android root)
- `package.json` (reference only)

## Step 2: Install Required Tools on Your Computer

### Windows, Mac, or Linux:

1. **Install Java Development Kit (JDK)**
   - Download JDK 11 or higher from: https://www.oracle.com/java/technologies/downloads/
   - Or use: `brew install openjdk` (Mac) / `choco install openjdk` (Windows)

2. **Install Android SDK**
   - Download from: https://developer.android.com/studio/command-line-tools
   - Or install full Android Studio: https://developer.android.com/studio

3. **Set up Environment Variables**
   - `JAVA_HOME` - Path to your JDK installation
   - `ANDROID_HOME` - Path to your Android SDK

   **On Mac/Linux:**
   ```bash
   export JAVA_HOME=/usr/libexec/java_home
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

   **On Windows:**
   - Set `JAVA_HOME` to your JDK folder
   - Set `ANDROID_HOME` to your Android SDK folder
   - Add both to System PATH

## Step 3: Build the APK

1. **Navigate to android folder:**
   ```bash
   cd android
   ```

2. **Build Debug APK (for testing):**
   ```bash
   ./gradlew assembleDebug
   ```
   Output: `app/build/outputs/apk/debug/app-debug.apk`

3. **Build Release APK (for Google Play):**
   ```bash
   ./gradlew assembleRelease
   ```
   Output: `app/build/outputs/apk/release/app-release.apk`

## Step 4: Install on Phone

### For Testing (Debug APK):

**Via USB:**
1. Connect Android phone via USB
2. Enable Developer Mode on phone (tap Build Number 7 times in Settings > About)
3. Run: `adb install app/build/outputs/apk/debug/app-debug.apk`

**Via File:**
1. Transfer `app-debug.apk` to phone
2. Open file manager on phone
3. Tap APK to install
4. Allow installation from unknown sources

### For Publishing (Release APK):

**Requirements:**
1. Signed APK (need keystore file - we'll create this next)
2. Google Play Developer Account ($25)

**Sign the Release APK:**
```bash
# Create keystore (one time only)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.jks app/build/outputs/apk/release/app-release.apk my-key-alias
```

Then upload to Google Play Console.

## Step 5: Update App in Future

After making changes in Replit:

```bash
# On Replit
npm run build
npx cap sync

# Download new android folder or just:
# cp -r android/ /path/to/local/android
```

Then rebuild APK:
```bash
cd android
./gradlew clean assembleDebug
```

## Troubleshooting

**"JAVA_HOME not set"**
- Check environment variables
- Restart terminal/IDE after setting them

**"SDK not found"**
- Download SDK using Android Studio
- Or run: `sdkmanager --licenses` to accept licenses

**"Build fails with 'gradle' command not found"**
- Use `./gradlew` (included in project) instead of system gradle

**APK won't install on phone**
- Enable "Unknown sources" in phone settings
- Make sure phone has enough storage
- Try uninstalling previous version first

## Questions?

- Android docs: https://developer.android.com/build
- Capacitor docs: https://capacitorjs.com/docs/getting-started
- Gradle docs: https://gradle.org/guides/

Good luck with your build!
