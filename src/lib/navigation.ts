import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Closes a form or sheet. `router.back()` does nothing when there's no
 * history behind the screen — e.g. after a page refresh, a shared link, or a
 * home-screen app reopening straight onto a form — so fall back to Home.
 */
export function useClose(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);
}
