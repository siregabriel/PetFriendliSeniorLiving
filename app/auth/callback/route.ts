/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 25, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

// app/auth/callback/route.ts
// Handles the OAuth redirect from Google via Supabase.
// The PKCE code exchange is performed client-side by the Supabase JS client
// automatically when it detects the `code` param in the URL. We simply
// redirect to the home page and let the client-side session hydrate normally.
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Pass the code along to the client via the home page redirect so the
  // Supabase client can exchange it and store the session in localStorage.
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    // Redirect to a client-side page that will handle the code exchange.
    // We use /auth/confirm which is a lightweight client component.
    const confirmUrl = new URL('/auth/confirm', requestUrl.origin);
    confirmUrl.searchParams.set('code', code);
    confirmUrl.searchParams.set('next', next);
    return NextResponse.redirect(confirmUrl);
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
