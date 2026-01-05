# Google Sign-In Setup Guide (No Firebase)

This guide explains how to set up **native Google Sign-In** for the Story-Nest Android app **without Firebase**.

## Setup Steps

### 1. Google Cloud Project Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Android
   - Add your app's package name: `com.tellmamma.app`
   - Get your SHA-1 fingerprint and add it
   - Copy the **Web Client ID** (you'll need this)

### 2. Get SHA-1 Fingerprint

For Android Sign-In, you need to register your app's SHA-1:

```bash
cd android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\gradlew.bat signingReport
```

Copy the SHA-1 from the output and add it to Google Cloud Console.

### 3. Android App Configuration

#### A. Google Play Services Dependencies
Added to `android/app/build.gradle`:
```gradle
implementation 'com.google.android.gms:play-services-auth:20.9.0'
```

#### B. Android Manifest Permissions
Already included in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 4. Environment Variables

Set your Google Client ID in `.env`:
```
VITE_GOOGLE_CLIENT_ID=your_web_client_id_from_google_cloud.apps.googleusercontent.com
```

## Usage

### Authentication Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <img src={user.photoUrl} alt={user.displayName} />
        <p>Welcome, {user.displayName}!</p>
        <p>Email: {user.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  return (
    <button onClick={signInWithGoogle}>Sign In with Google</button>
  );
}
```

### Google Sign-In Button

```typescript
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export function LoginPage() {
  return (
    <div>
      <h1>Sign In to Story-Nest</h1>
      <GoogleSignInButton />
    </div>
  );
}
```

## Platform Behavior

### Native (Android)
- Uses native Google Sign-In dialog
- No browser needed
- Seamless user experience
- Uses custom `GoogleSignInPlugin`

### Web
- Redirects to Google OAuth consent screen
- Standard Google login flow
- Redirects back to app after auth

## Building the Android App

1. Sync Capacitor:
```bash
npx cap sync android
```

2. Build debug APK:
```bash
cd android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\gradlew.bat assembleDebug --no-daemon
```

3. APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Testing

### On Device/Emulator
1. Install the APK
2. Tap the Google Sign-In button
3. Complete Google authentication
4. User info should display

### On Web
1. Run: `npm run dev:client`
2. Click sign-in button
3. You'll be redirected to Google
4. After sign-in, redirected back with auth data

## Troubleshooting

### Sign-In Not Working on Android
1. **SHA-1 fingerprint not registered**
   ```bash
   .\gradlew.bat signingReport
   ```
   Add output to Google Cloud Console

2. **Wrong Client ID**
   - Get Web Client ID (not Android Client ID)
   - Set in `.env` as `VITE_GOOGLE_CLIENT_ID`

3. **Wrong package name**
   - Verify package: `com.tellmamma.app`
   - Check in Google Cloud Console

### Plugin Not Found
```bash
npx cap sync android
```

### User Data Not Persisting
- Stored in localStorage on web
- User state persists in AuthContext

## Database Integration

To save user data to your database:

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Save user to database
      fetch('/api/auth/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: user.id,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
        }),
      });
    }
  }, [user]);
  
  return <div>Welcome {user?.displayName}</div>;
}
```

## Backend Integration

To verify the ID token on your backend:

```typescript
// server/routes.ts or similar
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    return {
      userId: payload['sub'],
      email: payload['email'],
      displayName: payload['name'],
      photoUrl: payload['picture'],
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

## Security Notes

- Never expose your Web Client ID in public repos
- Use environment variables for sensitive data
- Verify ID tokens on the backend
- Use HTTPS for all auth endpoints
- Never store sensitive tokens in localStorage (use HttpOnly cookies when possible)

## Differences from Firebase

| Feature | With Firebase | Without Firebase |
|---------|--------------|------------------|
| Sign-In | Firebase Auth | Google OAuth |
| Persistence | Automatic | Manual (localStorage) |
| User Database | Firestore | Your own DB |
| Security | Firebase rules | Your backend |
| Backend Needed | Optional | Required |

## Next Steps

1. Install APK and test on device
2. Set up user database table
3. Create API endpoint to save user
4. Add user profile page
5. Implement logout and session management

## Resources

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Story-Nest Project](..)
