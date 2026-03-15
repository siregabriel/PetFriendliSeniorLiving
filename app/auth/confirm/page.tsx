'use client';

// app/auth/confirm/page.tsx
// Client-side page that exchanges the OAuth PKCE code for a session.

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (!code) {
      router.replace('/');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[Auth] Code exchange failed:', error.message);
      }
      router.replace(next);
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-2xl">🐾</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">Signing you in...</p>
      </div>
    </div>
  );
}
