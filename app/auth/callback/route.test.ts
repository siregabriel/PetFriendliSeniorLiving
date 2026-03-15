/**
 * Unit tests for OAuth callback handler
 * Validates: Requirements 1.4, 6.1
 *
 * The callback route does NOT perform server-side code exchange.
 * Instead it forwards the `code` param to /auth/confirm (a client component)
 * which calls exchangeCodeForSession in the browser via the Supabase JS SDK.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url) => ({
      url: url.toString(),
      status: 307,
      type: 'redirect',
    })),
  },
}));

describe('OAuth Callback Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When code is present', () => {
    it('should redirect to /auth/confirm with code and next params', async () => {
      const req = new Request('https://example.com/auth/callback?code=test-auth-code');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.pathname).toBe('/auth/confirm');
      expect(redirectArg.searchParams.get('code')).toBe('test-auth-code');
      expect(redirectArg.searchParams.get('next')).toBe('/');
    });

    it('should preserve a custom next param', async () => {
      const req = new Request('https://example.com/auth/callback?code=abc&next=%2Fperfil');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.pathname).toBe('/auth/confirm');
      expect(redirectArg.searchParams.get('next')).toBe('/perfil');
    });

    it('should preserve the origin domain', async () => {
      const req = new Request('https://production.example.com/auth/callback?code=xyz');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.origin).toBe('https://production.example.com');
    });

    it('should not include extra query params in the redirect', async () => {
      const req = new Request('https://example.com/auth/callback?code=abc&state=csrf&other=junk');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.searchParams.has('state')).toBe(false);
      expect(redirectArg.searchParams.has('other')).toBe(false);
    });
  });

  describe('When code is missing', () => {
    it('should redirect to / when no code param', async () => {
      const req = new Request('https://example.com/auth/callback');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.pathname).toBe('/');
    });

    it('should redirect to / when code is empty string', async () => {
      const req = new Request('https://example.com/auth/callback?code=');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.pathname).toBe('/');
    });

    it('should redirect to / when only unrelated params are present', async () => {
      const req = new Request('https://example.com/auth/callback?state=xyz');
      await GET(req);

      const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectArg.pathname).toBe('/');
    });
  });
});
