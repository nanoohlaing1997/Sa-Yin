import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from './firebase';

/**
 * Single-user app. The owner's email comes from EXPO_PUBLIC_OWNER_EMAIL (not a
 * secret); the password is typed once per device and never shipped in the
 * build. Firebase persists the session, so it's only asked for again after
 * signing out or clearing site data.
 */
export const OWNER_EMAIL = process.env.EXPO_PUBLIC_OWNER_EMAIL ?? '';

type AuthContextValue = {
  user: User | null;
  initialising: boolean;
  signIn: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initialising, setInitialising] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setInitialising(false);
      }),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initialising,
      async signIn(password) {
        if (!OWNER_EMAIL) throw new Error('Missing EXPO_PUBLIC_OWNER_EMAIL in .env.');
        await signInWithEmailAndPassword(auth, OWNER_EMAIL, password);
      },
      async signOut() {
        await fbSignOut(auth);
      },
    }),
    [user, initialising]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Maps Firebase sign-in errors to something worth showing. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That password isn’t right.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    default:
      return error instanceof Error ? error.message : 'Could not sign in.';
  }
}
