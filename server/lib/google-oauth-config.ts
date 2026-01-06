// Google OAuth Configuration - Hardcoded credentials for server
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "112395408252-ela7l26ctmspe0bo5cc6plhbdfb7nnoe.apps.googleusercontent.com",
  clientSecret: "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",
  projectId: "tellmamma-483419",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  redirectUri: process.env.NODE_ENV === 'production'
    ? "https://tellmamma.com/api/auth/callback"
    : "http://localhost:3000/api/auth/callback",
  scope: "openid profile email",
};

