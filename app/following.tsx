// This file is now merged into followers.tsx
// Redirect to followers page with following tab active
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function FollowingScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  
  useEffect(() => {
    // Redirect to followers page (which now has tabs)
    router.replace({
      pathname: '/followers',
      params: userId ? { userId, initialTab: 'following' } : { initialTab: 'following' },
    });
  }, []);

  return null;
}
