/**
 * Unit tests for Admin Dashboard - Tab visibility per role
 * Feature: editorial-content-system
 * Validates: Requirements 2.2, 2.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './page';

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
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
    storage: {
      from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })),
    },
  },
}));

// Helper: set up Supabase mocks for a given role
function setupMocksForRole(rol: string) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
  });

  mockFrom.mockImplementation((_table: string) => {
    const resolved = Promise.resolve({ data: [], error: null });
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(resolved),
      single: vi.fn().mockResolvedValue({ data: { rol }, error: null }),
    };
    return chain;
  });
}

// Helper: set up mocks for unauthenticated user
function setupMocksForNoUser() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe('Admin Dashboard - Tab visibility per role (Requirements 2.2, 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Requirement 2.2: moderator sees only Articles tab
  // -------------------------------------------------------------------------
  describe('Requirement 2.2: moderator role tab isolation', () => {
    it('should show Articles tab for moderator', async () => {
      setupMocksForRole('moderator');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /articles/i })).toBeDefined();
      });
    });

    it('should NOT show Communities tab for moderator', async () => {
      setupMocksForRole('moderator');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /^communities$/i })).toBeNull();
      });
    });

    it('should NOT show New Community tab for moderator', async () => {
      setupMocksForRole('moderator');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /new community/i })).toBeNull();
      });
    });

    it('should NOT show Team tab for moderator', async () => {
      setupMocksForRole('moderator');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /team/i })).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 2.2 / 2.3: admin sees all tabs including Articles
  // -------------------------------------------------------------------------
  describe('admin role sees all tabs', () => {
    it('should show Communities tab for admin', async () => {
      setupMocksForRole('admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /communities/i })).toBeDefined();
      });
    });

    it('should show New Community tab for admin', async () => {
      setupMocksForRole('admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new community/i })).toBeDefined();
      });
    });

    it('should show Articles tab for admin', async () => {
      setupMocksForRole('admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /articles/i })).toBeDefined();
      });
    });

    it('should NOT show Team tab for admin (only super_admin)', async () => {
      setupMocksForRole('admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /team/i })).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // super_admin sees all tabs including Team
  // -------------------------------------------------------------------------
  describe('super_admin role sees all tabs', () => {
    it('should show Communities tab for super_admin', async () => {
      setupMocksForRole('super_admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /communities/i })).toBeDefined();
      });
    });

    it('should show New Community tab for super_admin', async () => {
      setupMocksForRole('super_admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new community/i })).toBeDefined();
      });
    });

    it('should show Articles tab for super_admin', async () => {
      setupMocksForRole('super_admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /articles/i })).toBeDefined();
      });
    });

    it('should show Team tab for super_admin', async () => {
      setupMocksForRole('super_admin');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /team/i })).toBeDefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 2.4: usuario sees access-denied screen
  // -------------------------------------------------------------------------
  describe('Requirement 2.4: usuario sees access-denied screen', () => {
    it('should show Access Denied heading for usuario role', async () => {
      setupMocksForRole('usuario');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeDefined();
      });
    });

    it('should NOT show any tab buttons for usuario role', async () => {
      setupMocksForRole('usuario');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /communities/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /articles/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /team/i })).toBeNull();
      });
    });

    it('should show a back-to-login button for usuario role', async () => {
      setupMocksForRole('usuario');
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to login/i })).toBeDefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Unauthenticated user is redirected
  // -------------------------------------------------------------------------
  describe('unauthenticated user is redirected to login', () => {
    it('should redirect to /login when no user session exists', async () => {
      setupMocksForNoUser();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });
});
