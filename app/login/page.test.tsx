/**
 * Unit tests for Login Page - Google OAuth Modifications
 * Feature: google-oauth-authentication
 * Validates: Requirements 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './page';
import { supabase } from '@/lib/supabase';

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

describe('Login Page - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 6.2: User Cancellation Handling', () => {
    it('should return to login without error when user cancels Google consent screen', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'AuthError', message: 'User cancelled OAuth flow: access_denied' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: No error displayed for cancellation (Requirement 6.2)
      await waitFor(() => {
        expect(screen.queryByText(/❌/)).toBeNull();
      });
    });

    it('should not display error for access_denied error code', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'AuthError', message: 'access_denied' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: No error shown for cancellation (Requirement 6.2)
      await waitFor(() => {
        expect(screen.queryByText(/❌/)).toBeNull();
      });
    });
  });

  describe('Requirement 6.3: Network Connectivity Error Handling', () => {
    it('should display connectivity message when network fails during OAuth', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'NetworkError', message: 'Network error: fetch failed' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Should display friendly connectivity message (Requirement 6.3)
      await waitFor(() => {
        expect(screen.getByText(/internet connection/i)).not.toBeNull();
      });
    });

    it('should display connectivity message for connection timeout', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'NetworkError', message: 'Connection timeout' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Timeout maps to connectivity message
      await waitFor(() => {
        expect(screen.getByText(/internet connection/i)).not.toBeNull();
      });
    });

    it('should display connectivity message for fetch failures', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'FetchError', message: 'Failed to fetch' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Fetch failure maps to connectivity message
      await waitFor(() => {
        expect(screen.getByText(/internet connection/i)).not.toBeNull();
      });
    });
  });

  describe('Requirement 6.1: OAuth Provider Error Handling', () => {
    it('should display user-friendly message when Google OAuth returns error', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'OAuthError', message: 'OAuth provider error: invalid_request' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Should display friendly provider error message (Requirement 6.1)
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).not.toBeNull();
      });
    });

    it('should display user-friendly message for server_error from provider', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'OAuthError', message: 'server_error' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Generic provider error shown
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).not.toBeNull();
      });
    });

    it('should display user-friendly message for temporarily_unavailable from provider', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'OAuthError', message: 'temporarily_unavailable' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
      });

      // Assert: Generic provider error shown
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).not.toBeNull();
      });
    });
  });

  describe('Requirement 6.4: Error State Updates', () => {
    it('should update error state correctly when OAuth fails', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'ConfigError', message: 'OAuth invalid_client configuration' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      // Verify no error initially
      expect(screen.queryByText(/❌/)).toBeNull();

      await user.click(googleButton);

      // Assert: Config error message displayed
      await waitFor(() => {
        expect(screen.getByText(/configuration/i)).not.toBeNull();
      });
    });

    it('should clear previous error when initiating new OAuth attempt', async () => {
      // Arrange
      const user = userEvent.setup();

      // First attempt: network error
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: null },
        error: { name: 'Error', message: 'network error occurred' } as any,
      });

      render(<Login />);
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      await user.click(googleButton);

      // Wait for first error to appear
      await waitFor(() => {
        expect(screen.getByText(/internet connection/i)).not.toBeNull();
      });

      // Second attempt: session error
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: null },
        error: { name: 'Error', message: 'session exchange failed' } as any,
      });

      // Act: Click again
      await user.click(googleButton);

      // Assert: Should show new error, not old one
      await waitFor(() => {
        expect(screen.getByText(/session creation failed/i)).not.toBeNull();
        expect(screen.queryByText(/internet connection/i)).toBeNull();
      });
    });

    it('should maintain error state until next OAuth attempt', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'Error', message: 'some provider error' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Assert: Error persists
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).not.toBeNull();
      });

      // Wait a bit and verify error still there
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByText(/authentication failed/i)).not.toBeNull();
    });

    it('should update loading state correctly during OAuth flow', async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOAuth: any;
      const oauthPromise = new Promise((resolve) => {
        resolveOAuth = resolve;
      });

      vi.mocked(supabase.auth.signInWithOAuth).mockReturnValue(oauthPromise as any);

      render(<Login />);
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      // Act: Click button
      await user.click(googleButton);

      // Assert: Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/connecting/i)).not.toBeNull();
      });

      // Resolve OAuth
      resolveOAuth({
        data: { provider: 'google', url: null },
        error: { name: 'Error', message: 'Test error' } as any,
      });

      // Assert: Loading state should clear
      await waitFor(() => {
        expect(screen.queryByText(/connecting/i)).toBeNull();
        expect(screen.getByRole('button', { name: /sign in with google/i })).not.toBeNull();
      });
    });
  });

  describe('Requirement 6.4: OAuth Configuration Validation', () => {
    it('should disable Google button when Supabase URL is missing', () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Act
      render(<Login />);

      // Assert: Button should be disabled
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton.hasAttribute('disabled')).toBe(true);
    });

    it('should disable Google button when Supabase anon key is missing', () => {
      // Arrange
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Act
      render(<Login />);

      // Assert: Button should be disabled
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton.hasAttribute('disabled')).toBe(true);
    });

    it('should enable Google button when configuration is valid', () => {
      // Arrange
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Act
      render(<Login />);

      // Assert: Button should be enabled
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton.hasAttribute('disabled')).toBe(false);
    });

    it('should log error when OAuth configuration is invalid', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Act
      render(<Login />);

      // Assert: Should log configuration error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OAuth Config]'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Message Display', () => {
    it('should display error message with error styling', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        // Generic provider error → maps to friendly "Authentication failed" message
        error: { name: 'Error', message: 'some provider error' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Assert: Friendly error message displayed with proper styling
      await waitFor(() => {
        const errorDiv = screen.getByText(/authentication failed/i).closest('div');
        expect(errorDiv?.className).toContain('bg-red-50');
        expect(errorDiv?.className).toContain('text-red-600');
      });
    });

    it('should display error icon (❌) with error message', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        // Network error → maps to friendly connectivity message
        error: { name: 'Error', message: 'network error occurred' } as any,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Assert: Should display error with ❌ icon and friendly message
      await waitFor(() => {
        const errorDiv = screen.getByText(/internet connection/i).closest('div');
        expect(errorDiv?.textContent).toContain('❌');
      });
    });
  });

  describe('OAuth Button Behavior', () => {
    it('should disable button during OAuth loading', async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOAuth: any;
      const oauthPromise = new Promise((resolve) => {
        resolveOAuth = resolve;
      });

      vi.mocked(supabase.auth.signInWithOAuth).mockReturnValue(oauthPromise as any);

      render(<Login />);
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      // Act
      await user.click(googleButton);

      // Assert: Button should be disabled during loading
      await waitFor(() => {
        const loadingButton = screen.getByText(/connecting/i).closest('button');
        expect(loadingButton?.hasAttribute('disabled')).toBe(true);
      });

      // Cleanup
      resolveOAuth({
        data: { provider: 'google', url: 'https://google.com/oauth' },
        error: null,
      });
    });

    it('should call signInWithOAuth with correct parameters', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://google.com/oauth' },
        error: null,
      });

      render(<Login />);

      // Act
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Assert: Should call with correct OAuth configuration
      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
      });
    });
  });
});

// ============================================================================
// Task 2.3: Unit tests for login page modifications
// Validates: Requirements 5.1, 5.2, 5.3, 5.5
// ============================================================================

describe('Login Page - Google Sign-In UI (Requirements 5.1, 5.2, 5.3, 5.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 5.1: Google button text and logo', () => {
    it('should render Google sign-in button with "Continue with Google" text', () => {
      render(<Login />);
      // Button text is "Continue with Google"; aria-label is "Sign in with Google"
      // Use getByText since aria-label overrides the accessible name for getByRole
      expect(screen.getByText('Continue with Google')).toBeDefined();
    });

    it('should render the Google logo SVG inside the button', () => {
      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });
      const svg = button.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should render Google logo with four colored paths', () => {
      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });
      const paths = button.querySelectorAll('svg path');
      // Google logo has 4 colored paths (blue, green, yellow, red)
      expect(paths.length).toBe(4);
    });

    it('should show "Connecting..." text while OAuth is loading', async () => {
      const user = userEvent.setup();
      let resolveOAuth: any;
      vi.mocked(supabase.auth.signInWithOAuth).mockReturnValue(
        new Promise((resolve) => { resolveOAuth = resolve; }) as any
      );

      render(<Login />);
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeDefined();
      });

      resolveOAuth({ data: { provider: 'google', url: null }, error: null });
    });
  });

  describe('Requirement 5.2: Accessibility - ARIA labels', () => {
    it('should have aria-label "Sign in with Google" on the button', () => {
      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });
      expect(button.getAttribute('aria-label')).toBe('Sign in with Google');
    });

    it('should be discoverable by assistive technologies via role="button"', () => {
      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Requirement 5.3: Visual separator between auth methods', () => {
    it('should display "OR" separator between email form and Google button', () => {
      render(<Login />);
      expect(screen.getByText('OR')).toBeDefined();
    });

    it('should render the separator as a visual divider element', () => {
      render(<Login />);
      const separator = screen.getByText('OR');
      // The OR text sits inside a relative container with a border-t divider
      const wrapper = separator.closest('div[class*="relative"]');
      expect(wrapper).not.toBeNull();
    });
  });

  describe('Requirement 5.5: Button disabled state during OAuth loading', () => {
    it('should disable the button while OAuth is in progress', async () => {
      const user = userEvent.setup();
      let resolveOAuth: any;
      vi.mocked(supabase.auth.signInWithOAuth).mockReturnValue(
        new Promise((resolve) => { resolveOAuth = resolve; }) as any
      );

      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });

      await user.click(button);

      await waitFor(() => {
        const loadingButton = screen.getByText('Connecting...').closest('button');
        expect(loadingButton?.hasAttribute('disabled')).toBe(true);
      });

      resolveOAuth({ data: { provider: 'google', url: null }, error: null });
    });

    it('should re-enable the button after OAuth completes with error', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { name: 'AuthError', message: 'Some error' } as any,
      });

      render(<Login />);
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /sign in with google/i });
        expect(button.hasAttribute('disabled')).toBe(false);
      });
    });

    it('should not call signInWithOAuth again when button is disabled', async () => {
      const user = userEvent.setup();
      let resolveOAuth: any;
      vi.mocked(supabase.auth.signInWithOAuth).mockReturnValue(
        new Promise((resolve) => { resolveOAuth = resolve; }) as any
      );

      render(<Login />);
      const button = screen.getByRole('button', { name: /sign in with google/i });

      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeDefined();
      });

      // Try clicking again while disabled
      await user.click(button);

      // Should only have been called once
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1);

      resolveOAuth({ data: { provider: 'google', url: null }, error: null });
    });
  });

  describe('handleGoogleSignIn calls signInWithOAuth with correct parameters', () => {
    it('should call signInWithOAuth with provider "google"', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      render(<Login />);
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({ provider: 'google' })
        );
      });
    });

    it('should include redirectTo pointing to /auth/callback', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      render(<Login />);
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              redirectTo: expect.stringContaining('/auth/callback'),
            }),
          })
        );
      });
    });

    it('should include offline access_type and consent prompt in queryParams', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      render(<Login />);
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
      });
    });
  });
});
