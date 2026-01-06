// Google OAuth 2.0 Configuration - Hardcoded credentials
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "112395408252-ela7l26ctmspe0bo5cc6plhbdfb7nnoe.apps.googleusercontent.com",
  clientSecret: "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",
  projectId: "tellmamma-483419",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  redirectUris: ["https://tellmamma.com/api/auth/callback"],
  javascriptOrigins: ["https://tellmamma.com", "http://localhost:3000"],
};

// Determine the redirect URI based on environment
export function getRedirectUri(): string {
  const origin = process.env.ORIGIN || "http://localhost:3000";
  if (origin.includes("localhost")) {
    return "http://localhost:3000/api/auth/callback";
  }
  return "https://tellmamma.com/api/auth/callback";
}

// Determine the frontend redirect URI after OAuth
export function getFrontendRedirectUri(): string {
  const origin = process.env.ORIGIN || "http://localhost:3000";
  return origin;
}

