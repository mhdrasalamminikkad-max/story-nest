import { auth } from "../firebase-admin";

// Get auth from initialized Firebase Admin app
// Note: auth is pre-initialized in ../firebase-admin.ts

/**
 * Verify Firebase ID Token
 * @param token - The Firebase ID token
 * @returns The decoded token with user information
 */
export const verifyIdToken = async (token: string) => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get user by ID
 * @param uid - The user ID
 * @returns The user record
 */
export const getUserById = async (uid: string) => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    return await auth.getUser(uid);
  } catch (error) {
    throw new Error(`Failed to get user: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Create custom token for user (for testing/native platforms)
 * @param uid - The user ID
 * @returns Custom token
 */
export const createCustomToken = async (uid: string) => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    return await auth.createCustomToken(uid);
  } catch (error) {
    throw new Error(`Failed to create custom token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Set custom claims for user
 * @param uid - The user ID
 * @param customClaims - The custom claims object
 */
export const setUserClaims = async (uid: string, customClaims: { [key: string]: any }) => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    await auth.setCustomUserClaims(uid, customClaims);
  } catch (error) {
    throw new Error(`Failed to set custom claims: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
