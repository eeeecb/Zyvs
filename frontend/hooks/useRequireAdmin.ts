'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useRequireAdmin() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only check after hydration is complete
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  return {
    user,
    isAdmin: user?.role === 'ADMIN',
    isLoading: !_hasHydrated
  };
}
