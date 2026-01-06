// Google OAuth Configuration - Hardcoded credentials (client-side safe - NO SECRET)
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "112395408252-ela7l26ctmspe0bo5cc6plhbdfb7nnoe.apps.googleusercontent.com",
  // Client secret should NEVER be in client-side code
  projectId: "tellmamma-483419",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  redirectUri: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? "http://localhost:3000/api/auth/callback"
        : "https://tellmamma.com/api/auth/callback")
    : "http://localhost:3000/api/auth/callback",
  javascriptOrigins: ["https://tellmamma.com", "http://localhost:3000"],
  scope: "openid profile email",
};

