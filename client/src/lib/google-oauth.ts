// Google OAuth 2.0 Configuration - Hardcoded credentials (client-side safe)
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "112395408252-ela7l26ctmspe0bo5cc6plhbdfb7nnoe.apps.googleusercontent.com",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
};

// Get the redirect URI for OAuth (should match server)
export function getRedirectUri(): string {
  const origin = window.location.origin;
  if (origin.includes("localhost")) {
    return "http://localhost:3000/api/auth/callback";
  }
  return "https://tellmamma.com/api/auth/callback";
}

