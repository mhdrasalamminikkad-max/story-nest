import { useAuth } from '@/contexts/AuthContext';
import type { GoogleUser } from '@/contexts/AuthContext';

export interface AuthState {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * @deprecated Use useAuth hook from AuthContext instead.
 * This hook is kept for backward compatibility.
 */
export const useGoogleSignIn = () => {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();

  return {
    user,
    loading,
    error,
    signInWithGoogle: async () => {
      await signInWithGoogle();
      return user;
    },
    signOut,
    getCurrentUser: async () => {
      return user;
    },
  };
};
