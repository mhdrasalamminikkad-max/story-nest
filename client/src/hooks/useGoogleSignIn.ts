import { useCallback, useState } from 'react';
import { signInWithGoogle, signOutUser, getCurrentUser, type AuthUser } from '../lib/firebase-auth';

export interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  idToken?: string;
}

export interface AuthState {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
}

export const useGoogleSignIn = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const signInWithGoogleHandler = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const authUser: AuthUser = await signInWithGoogle();
      
      const user: GoogleUser = {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
        photoUrl: authUser.photoUrl,
      };

      setState(prev => ({
        ...prev,
        user,
        loading: false,
      }));

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signOutUser();
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-out failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const getCurrentUserHandler = useCallback(async () => {
    try {
      const authUser = await getCurrentUser();
      if (authUser) {
        const user: GoogleUser = {
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName,
          photoUrl: authUser.photoUrl,
        };
        setState(prev => ({ ...prev, user }));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    signInWithGoogle: signInWithGoogleHandler,
    signOut,
    getCurrentUser: getCurrentUserHandler,
  };
};
