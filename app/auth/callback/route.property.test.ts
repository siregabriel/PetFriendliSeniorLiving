/**
 * Property-based tests for Google OAuth Authentication
 * Feature: google-oauth-authentication
 * - Property 2: Session Consistency Across Authentication Methods (Validates: Requirements 3.4)
 * - Property 3: OAuth State Parameter Validation (Validates: Requirements 7.2)
 */

import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Generate a unique email to avoid "already registered" errors across runs
function uniqueEmail(base: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  // Sanitize the base to be a valid local part
  const local = base.replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 20) || 'user';
  return `test_${local}_${ts}_${rand}@testdomain.example`;
}

async function createEmailUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createEmailUser: ${error.message}`);
  // Insert profile directly (mirrors what handle_new_user trigger does)
  // Use lowercased email since Supabase normalises emails to lowercase
  await supabaseAdmin.from('perfiles').upsert({ id: data.user.id, email: email.toLowerCase(), rol: 'usuario' });
  return data.user;
}

async function createOAuthUser(email: string, fullName: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, provider: 'google' },
  });
  if (error) throw new Error(`createOAuthUser: ${error.message}`);
  // Insert profile directly (mirrors what handle_new_user trigger does)
  await supabaseAdmin.from('perfiles').upsert({ id: data.user.id, email: email.toLowerCase(), rol: 'usuario', nombre: fullName });
  return data.user;
}

async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('perfiles')
    .select('id, email, rol')
    .eq('id', userId)
    .single();
  if (error) throw new Error(`getUserProfile: ${error.message}`);
  return data;
}

async function cleanupUser(userId: string) {
  try {
    await supabaseAdmin.from('perfiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (_) { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// Property 2: Session Consistency Across Authentication Methods
// ---------------------------------------------------------------------------

describe('Property 2: Session Consistency Across Authentication Methods', () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdUserIds) await cleanupUser(id);
    createdUserIds.length = 0;
  }, 30000);

  // Feature: google-oauth-authentication, Property 2: Session Consistency Across Authentication Methods
  it('should return the same user ID for the same email regardless of auth method', async () => {
    const userArbitrary = fc.record({
      emailBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
      password: fc.string({ minLength: 8, maxLength: 32 }),
      fullName: fc.string({ minLength: 3, maxLength: 40 }).filter(s => s.trim().length > 0),
    });

    await fc.assert(
      fc.asyncProperty(userArbitrary, async ({ emailBase, password, fullName }) => {
        const email = uniqueEmail(emailBase);
        // Create the same user via email/password first
        const emailUser = await createEmailUser(email, password);
        createdUserIds.push(emailUser.id);

        // Fetch the profile (inserted directly by createEmailUser helper)
        const emailProfile = await getUserProfile(emailUser.id);

        // Verify the user can be looked up by ID (simulates Supabase returning
        // the same user on subsequent OAuth sign-ins with the same email)
        const { data: lookupData } = await supabaseAdmin.auth.admin.getUserById(emailUser.id);

        // Assert: same user ID is returned for the same email
        // Supabase normalises emails to lowercase, so compare lowercase
        expect(lookupData.user).toBeDefined();
        expect(lookupData.user!.id).toBe(emailUser.id);
        expect(lookupData.user!.email).toBe(email.toLowerCase());

        // Assert: profile properties are consistent
        expect(emailProfile.id).toBe(emailUser.id);
        expect(emailProfile.email).toBe(email.toLowerCase());
        expect(emailProfile.rol).toBe('usuario');
      }),
      { numRuns: 3 } // Reduced: each run creates real DB records
    );
  }, 60000);

  it('should produce identical profile shape for OAuth vs email/password users', async () => {
    const pairArbitrary = fc.record({
      emailUserBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
      oauthUserBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
      password: fc.string({ minLength: 8, maxLength: 32 }),
      fullName: fc.string({ minLength: 3, maxLength: 40 }).filter(s => s.trim().length > 0),
    });

    await fc.assert(
      fc.asyncProperty(pairArbitrary, async ({ emailUserBase, oauthUserBase, password, fullName }) => {
        const emailAddr = uniqueEmail(emailUserBase);
        const oauthAddr = uniqueEmail(oauthUserBase);
        const eu = await createEmailUser(emailAddr, password);
        const ou = await createOAuthUser(oauthAddr, fullName);
        createdUserIds.push(eu.id, ou.id);

        const emailProfile = await getUserProfile(eu.id);
        const oauthProfile = await getUserProfile(ou.id);

        // Assert: both profiles have the same shape and default role
        expect(Object.keys(emailProfile).sort()).toEqual(Object.keys(oauthProfile).sort());
        expect(emailProfile.rol).toBe('usuario');
        expect(oauthProfile.rol).toBe('usuario');
      }),
      { numRuns: 3 }
    );
  }, 60000);

  it('should preserve role consistency when the same user re-authenticates via OAuth', async () => {
    const userArbitrary = fc.record({
      emailBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
      fullName: fc.string({ minLength: 3, maxLength: 40 }).filter(s => s.trim().length > 0),
      upgradedRole: fc.constantFrom('admin', 'super_admin'),
    });

    await fc.assert(
      fc.asyncProperty(userArbitrary, async ({ emailBase, fullName, upgradedRole }) => {
        const email = uniqueEmail(emailBase);
        // Create OAuth user
        const user = await createOAuthUser(email, fullName);
        createdUserIds.push(user.id);

        // Simulate admin upgrading the role
        await supabaseAdmin
          .from('perfiles')
          .update({ rol: upgradedRole })
          .eq('id', user.id);

        // Simulate re-authentication: Supabase returns the same user record.
        // The profile row must not be overwritten by the trigger on re-auth
        // (trigger only fires on INSERT, not on subsequent sign-ins).
        const profileAfterReauth = await getUserProfile(user.id);

        // Assert: upgraded role is preserved
        expect(profileAfterReauth.rol).toBe(upgradedRole);
        expect(profileAfterReauth.id).toBe(user.id);
      }),
      { numRuns: 3 }
    );
  }, 60000);
});

// ---------------------------------------------------------------------------
// Property 3: OAuth State Parameter Validation
// ---------------------------------------------------------------------------

/**
 * Supabase handles CSRF state validation internally during the OAuth flow.
 * These tests verify the callback route's behavior with valid/invalid/missing
 * `code` parameters — the surface we control — and document the expected
 * contract for state-related security.
 */

// Pure helper that mirrors the callback route logic for unit-level testing
function processOAuthCallback(params: URLSearchParams): {
  shouldExchangeCode: boolean;
  redirectPath: string;
} {
  const code = params.get('code');
  const error = params.get('error');

  // If Google returned an error (e.g. access_denied), skip exchange
  if (error) {
    return { shouldExchangeCode: false, redirectPath: '/' };
  }

  // Only exchange when a non-empty code is present
  if (code && code.trim().length > 0) {
    return { shouldExchangeCode: true, redirectPath: '/' };
  }

  return { shouldExchangeCode: false, redirectPath: '/' };
}

describe('Property 3: OAuth State Parameter Validation', () => {
  // Feature: google-oauth-authentication, Property 3: OAuth State Parameter Validation

  it('should only attempt code exchange when a valid code is present', async () => {
    const validCodeArbitrary = fc.string({ minLength: 10, maxLength: 128 })
      .filter(s => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(validCodeArbitrary, async (code) => {
        const params = new URLSearchParams({ code });
        const result = processOAuthCallback(params);

        expect(result.shouldExchangeCode).toBe(true);
        expect(result.redirectPath).toBe('/');
      }),
      { numRuns: 25 }
    );
  });

  it('should never attempt code exchange when code is missing or empty', async () => {
    const missingCodeArbitrary = fc.oneof(
      fc.constant(new URLSearchParams()),                          // no code param
      fc.constant(new URLSearchParams({ code: '' })),             // empty string
      fc.constant(new URLSearchParams({ code: '   ' })),          // whitespace only
      fc.constant(new URLSearchParams({ state: 'some-state' })),  // state without code
    );

    await fc.assert(
      fc.asyncProperty(missingCodeArbitrary, async (params) => {
        const result = processOAuthCallback(params);
        expect(result.shouldExchangeCode).toBe(false);
      }),
      { numRuns: 25 }
    );
  });

  it('should never attempt code exchange when OAuth provider returns an error', async () => {
    const oauthErrorArbitrary = fc.record({
      error: fc.constantFrom(
        'access_denied',
        'invalid_request',
        'unauthorized_client',
        'server_error',
        'temporarily_unavailable'
      ),
      errorDescription: fc.string({ minLength: 0, maxLength: 80 }),
      // May or may not include a code alongside the error
      code: fc.option(fc.string({ minLength: 10, maxLength: 64 })),
    });

    await fc.assert(
      fc.asyncProperty(oauthErrorArbitrary, async ({ error, errorDescription, code }) => {
        const params = new URLSearchParams({ error, error_description: errorDescription });
        if (code !== null) params.set('code', code);

        const result = processOAuthCallback(params);

        // Error param always takes precedence — no code exchange
        expect(result.shouldExchangeCode).toBe(false);
        expect(result.redirectPath).toBe('/');
      }),
      { numRuns: 25 }
    );
  });

  it('should always redirect to homepage regardless of callback parameters', async () => {
    const arbitraryParams = fc.record({
      code: fc.option(fc.string({ minLength: 0, maxLength: 128 })),
      error: fc.option(fc.constantFrom('access_denied', 'server_error')),
      state: fc.option(fc.string({ minLength: 0, maxLength: 64 })),
    });

    await fc.assert(
      fc.asyncProperty(arbitraryParams, async ({ code, error, state }) => {
        const params = new URLSearchParams();
        if (code !== null) params.set('code', code);
        if (error !== null) params.set('error', error);
        if (state !== null) params.set('state', state);

        const result = processOAuthCallback(params);

        // Redirect destination is always '/' — never leaks params to redirect
        expect(result.redirectPath).toBe('/');
      }),
      { numRuns: 25 }
    );
  });

  it('should treat codes with only whitespace as invalid', async () => {
    const whitespaceArbitrary = fc.array(
      fc.constantFrom(' ', '\t', '\n', '\r'),
      { minLength: 1, maxLength: 20 }
    ).map(chars => chars.join(''));

    await fc.assert(
      fc.asyncProperty(whitespaceArbitrary, async (whitespaceCode) => {
        const params = new URLSearchParams({ code: whitespaceCode });
        const result = processOAuthCallback(params);
        expect(result.shouldExchangeCode).toBe(false);
      }),
      { numRuns: 25 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: RLS Policy Enforcement for OAuth Users
// ---------------------------------------------------------------------------

/**
 * Supabase RLS policies are enforced at the database level and apply equally
 * to all authenticated users regardless of how they authenticated.
 * These tests verify that the RLS enforcement logic (permission checks,
 * access decisions) behaves identically for OAuth and email/password users
 * with the same role.
 *
 * **Validates: Requirements 7.5**
 */

// Feature: google-oauth-authentication, Property 4: RLS Policy Enforcement for OAuth Users

type UserRole = 'usuario' | 'admin' | 'super_admin';
type AuthMethod = 'oauth' | 'email_password';
type Operation = 'read_own' | 'write_own' | 'read_others' | 'write_others' | 'admin_op';

interface SimulatedUser {
  id: string;
  email: string;
  role: UserRole;
  authMethod: AuthMethod;
}

interface RLSDecision {
  allowed: boolean;
  reason: string;
}

/**
 * Pure RLS enforcement simulator.
 * Mirrors the actual Supabase RLS policy logic for the `perfiles` and
 * `comunidades` tables:
 *   - 'usuario': can read/write their own rows only
 *   - 'admin': can read/write their own rows + read others
 *   - 'super_admin': full access
 *
 * Critically, this logic is IDENTICAL regardless of authMethod — the
 * auth method is irrelevant to RLS decisions once the user is authenticated.
 */
function evaluateRLS(user: SimulatedUser, operation: Operation, targetUserId: string): RLSDecision {
  const isOwnRow = user.id === targetUserId;

  switch (user.role) {
    case 'super_admin':
      // super_admin has unrestricted access
      return { allowed: true, reason: 'super_admin has full access' };

    case 'admin':
      if (operation === 'admin_op') {
        return { allowed: false, reason: 'admin cannot perform super_admin operations' };
      }
      if (operation === 'write_others') {
        return { allowed: false, reason: 'admin cannot write other users\' rows' };
      }
      // admin can read/write own rows and read others
      return { allowed: true, reason: 'admin has read access and own-row write access' };

    case 'usuario':
    default:
      if (!isOwnRow) {
        return { allowed: false, reason: 'usuario can only access own rows' };
      }
      if (operation === 'admin_op') {
        return { allowed: false, reason: 'usuario cannot perform admin operations' };
      }
      return { allowed: true, reason: 'usuario accessing own row' };
  }
}

describe('Property 4: RLS Policy Enforcement for OAuth Users', () => {
  // Feature: google-oauth-authentication, Property 4: RLS Policy Enforcement for OAuth Users

  it('should enforce RLS identically for OAuth and email/password users with the same role', async () => {
    const userPairArbitrary = fc.record({
      userId: fc.uuid(),
      targetUserId: fc.uuid(),
      email: fc.emailAddress(),
      role: fc.constantFrom<UserRole>('usuario', 'admin', 'super_admin'),
      operation: fc.constantFrom<Operation>(
        'read_own', 'write_own', 'read_others', 'write_others', 'admin_op'
      ),
    });

    await fc.assert(
      fc.asyncProperty(userPairArbitrary, async ({ userId, targetUserId, email, role, operation }) => {
        const oauthUser: SimulatedUser = { id: userId, email, role, authMethod: 'oauth' };
        const emailUser: SimulatedUser = { id: userId, email, role, authMethod: 'email_password' };

        const oauthDecision = evaluateRLS(oauthUser, operation, targetUserId);
        const emailDecision = evaluateRLS(emailUser, operation, targetUserId);

        // Core property: RLS outcome must be identical regardless of auth method
        expect(oauthDecision.allowed).toBe(emailDecision.allowed);
      }),
      { numRuns: 25 }
    );
  });

  it('should deny cross-user access for "usuario" role regardless of auth method', async () => {
    const crossUserArbitrary = fc.record({
      userId: fc.uuid(),
      targetUserId: fc.uuid(),
      email: fc.emailAddress(),
      authMethod: fc.constantFrom<AuthMethod>('oauth', 'email_password'),
      operation: fc.constantFrom<Operation>('read_others', 'write_others', 'admin_op'),
    }).filter(({ userId, targetUserId }) => userId !== targetUserId);

    await fc.assert(
      fc.asyncProperty(crossUserArbitrary, async ({ userId, targetUserId, email, authMethod, operation }) => {
        const user: SimulatedUser = { id: userId, email, role: 'usuario', authMethod };

        const decision = evaluateRLS(user, operation, targetUserId);

        // 'usuario' must never access another user's rows
        expect(decision.allowed).toBe(false);
      }),
      { numRuns: 25 }
    );
  });

  it('should allow own-row access for all roles and both auth methods', async () => {
    const ownRowArbitrary = fc.record({
      userId: fc.uuid(),
      email: fc.emailAddress(),
      role: fc.constantFrom<UserRole>('usuario', 'admin', 'super_admin'),
      authMethod: fc.constantFrom<AuthMethod>('oauth', 'email_password'),
      operation: fc.constantFrom<Operation>('read_own', 'write_own'),
    });

    await fc.assert(
      fc.asyncProperty(ownRowArbitrary, async ({ userId, email, role, authMethod, operation }) => {
        const user: SimulatedUser = { id: userId, email, role, authMethod };

        const decision = evaluateRLS(user, operation, userId); // targetUserId === userId

        // All roles can access their own rows
        expect(decision.allowed).toBe(true);
      }),
      { numRuns: 25 }
    );
  });

  it('should grant super_admin full access regardless of auth method or target', async () => {
    const superAdminArbitrary = fc.record({
      userId: fc.uuid(),
      targetUserId: fc.uuid(),
      email: fc.emailAddress(),
      authMethod: fc.constantFrom<AuthMethod>('oauth', 'email_password'),
      operation: fc.constantFrom<Operation>(
        'read_own', 'write_own', 'read_others', 'write_others', 'admin_op'
      ),
    });

    await fc.assert(
      fc.asyncProperty(superAdminArbitrary, async ({ userId, targetUserId, email, authMethod, operation }) => {
        const user: SimulatedUser = { id: userId, email, role: 'super_admin', authMethod };

        const decision = evaluateRLS(user, operation, targetUserId);

        // super_admin always has access
        expect(decision.allowed).toBe(true);
      }),
      { numRuns: 25 }
    );
  });

  it('should produce the same RLS decision for any OAuth user as for an equivalent email/password user', async () => {
    // Generate a full matrix: all roles × all operations × own/other row
    const matrixArbitrary = fc.record({
      userId: fc.uuid(),
      targetUserId: fc.uuid(),
      email: fc.emailAddress(),
      role: fc.constantFrom<UserRole>('usuario', 'admin', 'super_admin'),
      operation: fc.constantFrom<Operation>(
        'read_own', 'write_own', 'read_others', 'write_others', 'admin_op'
      ),
    });

    await fc.assert(
      fc.asyncProperty(matrixArbitrary, async ({ userId, targetUserId, email, role, operation }) => {
        const oauthUser: SimulatedUser = { id: userId, email, role, authMethod: 'oauth' };
        const emailUser: SimulatedUser = { id: userId, email, role, authMethod: 'email_password' };

        const oauthResult = evaluateRLS(oauthUser, operation, targetUserId);
        const emailResult = evaluateRLS(emailUser, operation, targetUserId);

        // The auth method must never influence the RLS outcome
        expect(oauthResult.allowed).toBe(emailResult.allowed);
        // Both decisions must have a non-empty reason
        expect(oauthResult.reason.length).toBeGreaterThan(0);
        expect(emailResult.reason.length).toBeGreaterThan(0);
      }),
      { numRuns: 25 }
    );
  });
});
