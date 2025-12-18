# Tell Mamma - Mobile App Setup (Capacitor)

Your Tell Mamma app has been successfully configured for iOS and Android using Capacitor!

## What Was Set Up

✅ **Capacitor Core** - Bridge between web app and native platforms
✅ **iOS Project** - Located in `./ios` directory
✅ **Android Project** - Located in `./android` directory  
✅ **Web Assets Synced** - Both platforms have the latest web app built

## Next Steps to Build

### 1. **For iOS (Mac only)**

First, install dependencies:
```bash
cd ios/App
pod install
cd ../..
```

Then open in Xcode:
```bash
npx cap open ios
```

In Xcode:
- Select your development team
- Choose simulator or connected device
- Press Play (▶) to build and run

### 2. **For Android (Windows/Mac/Linux)**

First, make sure you have:
- Android Studio installed
- ANDROID_HOME environment variable set

Then open Android Studio:
```bash
npx cap open android
```

In Android Studio:
- Wait for Gradle sync to complete
- Select a simulator or connected device
- Press Play (▶) to build and run

## Development Workflow

After making changes to the web app:

```bash
# 1. Build the web app
npm run build

# 2. Sync changes to both platforms
npx cap sync

# 3. Open platform to rebuild
npx cap open ios    # or
npx cap open android
```

## Building for Production (App Store / Google Play)

### iOS (App Store)
```bash
npx cap open ios
# In Xcode: Product > Archive
# Then upload to App Store Connect
```

### Android (Google Play)
```bash
npx cap open android
# In Android Studio: Build > Generate Signed Bundle / APK
# Upload signed bundle to Google Play Console
```

## Important Notes

- Your backend Express server is required to be accessible from mobile devices
- Update the API URL in your frontend code if needed for mobile environment
- iOS builds require a Mac with Xcode installed
- Android builds can be done on any platform with Android Studio

## Troubleshooting

If web assets don't update:
```bash
npm run build
npx cap sync
```

If you get build errors:
- Clear iOS build: `rm -rf ios/Pods` then `pod install` again
- Clear Android build: In Android Studio, click "Clean Project"

## Next: Publish to App Stores

When ready to release:
1. Register Apple Developer Account ($99/year) for iOS
2. Register Google Play Developer Account ($25 one-time) for Android
3. Follow their respective submission guidelines

Need help? Visit: https://capacitorjs.com/docs/getting-started
