import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { firebaseConfig } from './env';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): firebaseAuth.Auth {
  // Web: the browser build persists the session in IndexedDB by default.
  if (Platform.OS === 'web') return firebaseAuth.getAuth(app);

  // Native: `getReactNativePersistence` only exists in the react-native build of
  // firebase/auth (Metro resolves it via package exports); the published types
  // point at the web build, so it isn't in the type definitions.
  const { getReactNativePersistence } = firebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => firebaseAuth.Persistence;
  };
  try {
    return firebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if called twice (Fast Refresh re-runs modules).
    return firebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
