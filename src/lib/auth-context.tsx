import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth } from './firebase';

/**
 * Single-user app: there are no login screens. The app signs in silently with
 * the owner account from EXPO_PUBLIC_OWNER_EMAIL / EXPO_PUBLIC_OWNER_PASSWORD
 * so Firestore rules (which key off the uid) keep working and data is shared
 * across devices. The session is persisted by Firebase after the first sign-in.
 */
type AuthContextValue = {
  user: User | null;
  initialising: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initialising, setInitialising] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (next) => {
      if (cancelled) return;
      if (next) {
        setUser(next);
        setError(null);
        setInitialising(false);
        return;
      }
      const email = process.env.EXPO_PUBLIC_OWNER_EMAIL;
      const password = process.env.EXPO_PUBLIC_OWNER_PASSWORD;
      if (!email || !password) {
        setError('Missing EXPO_PUBLIC_OWNER_EMAIL / EXPO_PUBLIC_OWNER_PASSWORD in .env.');
        setInitialising(false);
        return;
      }
      try {
        // Success triggers onAuthStateChanged again with the user.
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        if (cancelled) return;
        const code = (e as { code?: string }).code ?? '';
        setError(
          code === 'auth/invalid-credential' || code === 'auth/user-not-found'
            ? 'Owner account not found or wrong password. Create it in Firebase console → Authentication → Users.'
            : e instanceof Error
              ? e.message
              : 'Could not sign in.'
        );
        setInitialising(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, initialising, error }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
