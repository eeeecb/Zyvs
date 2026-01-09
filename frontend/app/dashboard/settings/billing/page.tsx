'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect from old billing page to new unified settings page
 * This maintains backwards compatibility for any bookmarked links
 */
export default function OldBillingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/configuracoes?tab=cobranca');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-black border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold">Redirecionando...</p>
      </div>
    </div>
  );
}
