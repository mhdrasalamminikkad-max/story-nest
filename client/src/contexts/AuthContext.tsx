import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER = {
  uid: "demo-user-123",
  email: "demo@storynest.com",
  displayName: "Demo User",
  photoURL: null,
  emailVerified: true,
  getIdToken: async () => "demo-token-for-testing",
} as unknown as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(FAKE_USER);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    return FAKE_USER;
  };

  const signOut = async () => {
    console.log("Sign out disabled in demo mode");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
