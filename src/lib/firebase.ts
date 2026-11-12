import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, initializeAuth } from 'firebase/auth';
// `getReactNativePersistence` only exists in the react-native build of firebase/auth,
// which Metro resolves via package exports. The published types point at the web
// build, so TypeScript can't see it.
// @ts-expect-error -- react-native-only export
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './env';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if called twice on the same app (Fast Refresh re-runs modules).
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('firebase/auth').getAuth(app) as Auth;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
