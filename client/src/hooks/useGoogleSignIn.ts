import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { useCallback, useState } from 'react';

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

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      const user: GoogleUser = {
        id: result.user?.uid || '',
        email: result.user?.email || '',
        displayName: result.user?.displayName || '',
        photoUrl: result.user?.photoURL || undefined,
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
      await FirebaseAuthentication.signOut();
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

  const getCurrentUser = useCallback(async () => {
    try {
      const result = await FirebaseAuthentication.getCurrentUser();
      if (result.user) {
        const user: GoogleUser = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoUrl: result.user.photoURL || undefined,
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
    signInWithGoogle,
    signOut,
    getCurrentUser,
  };
};
