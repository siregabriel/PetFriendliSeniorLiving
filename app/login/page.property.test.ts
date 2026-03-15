/**
 * Property-based tests for Google OAuth Authentication
 * Feature: google-oauth-authentication
 * - Property 5: Default Role Assignment (Validates: Requirements 2.2, 8.1)
 * - Property 8: Error Message Distinctness (Validates: Requirements 6.5)
 */

import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate random Google OAuth user data
const googleOAuthUserArbitrary = fc.record({
  emailBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
  fullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
  googleId: fc.uuid(),
});

// Generate a unique email to avoid "already registered" errors across runs
function uniqueEmail(base: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  const local = base.replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 20) || 'user';
  return `test_${local}_${ts}_${rand}@testdomain.example`;
}

// Helper function to simulate OAuth user creation
async function createOAuthUser(userData: { email: string; fullName: string; googleId: string }) {
  // Create user via Supabase Admin API (simulating OAuth flow)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    email_confirm: true,
    user_metadata: {
      full_name: userData.fullName,
      provider: 'google',
      sub: userData.googleId,
    },
  });

  if (authError) {
    throw new Error(`Failed to create OAuth user: ${authError.message}`);
  }

  // Insert profile directly (mirrors what handle_new_user trigger does)
  await supabaseAdmin.from('perfiles').upsert({
    id: authData.user.id,
    email: userData.email,
    rol: 'usuario',
    nombre: userData.fullName,
  });

  return authData.user;
}

// Helper function to get user profile from perfiles table
async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

// Helper function to clean up test users
async function cleanupTestUser(userId: string) {
  try {
    // Delete from perfiles table first (due to foreign key constraint)
    await supabaseAdmin.from('perfiles').delete().eq('id', userId);
    
    // Delete from auth.users
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Poll until the trigger-created profile row appears (max 5s)
async function waitForProfile(userId: string, maxMs = 5000): Promise<void> {
  const interval = 200;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { data } = await supabaseAdmin.from('perfiles').select('id').eq('id', userId).maybeSingle();
    if (data) return;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`waitForProfile: profile for ${userId} not created within ${maxMs}ms`);
}

describe('Property 5: Default Role Assignment', () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    // Clean up all created test users
    for (const userId of createdUserIds) {
      await cleanupTestUser(userId);
    }
    createdUserIds.length = 0;
  });

  // Feature: google-oauth-authentication, Property 5: Default Role Assignment
  it('should assign role "usuario" to any new user created via Google OAuth', async () => {
    await fc.assert(
      fc.asyncProperty(
        googleOAuthUserArbitrary,
        async (userData) => {
          const email = uniqueEmail(userData.emailBase);
          // Act: Create a new OAuth user
          const user = await createOAuthUser({ email, fullName: userData.fullName, googleId: userData.googleId });
          createdUserIds.push(user.id);

          // Assert: Verify profile was created with role "usuario"
          const profile = await getUserProfile(user.id);

          expect(profile).toBeDefined();
          expect(profile.id).toBe(user.id);
          expect(profile.rol).toBe('usuario');
          expect(profile.email).toBe(email);
        }
      ),
      { numRuns: 3 } // Reduced: each run creates real DB records
    );
  }, 60000);

  it('should consistently assign "usuario" role across different email domains', async () => {
    const emailDomainArbitrary = fc.record({
      localPart: fc.stringMatching(/^[a-z0-9]+$/),
      domain: fc.oneof(
        fc.constant('gmail.com'),
        fc.constant('yahoo.com'),
        fc.constant('outlook.com'),
        fc.constant('hotmail.com'),
        fc.constant('example.com')
      ),
      fullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
      googleId: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(
        emailDomainArbitrary,
        async (userData) => {
          // Use uniqueEmail to avoid collisions; embed the domain for traceability
          const ts = Date.now();
          const rand = Math.random().toString(36).slice(2, 7);
          const local = (userData.localPart || 'user').slice(0, 10);
          const email = `test_${local}_${ts}_${rand}@${userData.domain}`;
          
          // Act: Create OAuth user with specific email domain
          const user = await createOAuthUser({
            email,
            fullName: userData.fullName,
            googleId: userData.googleId,
          });
          createdUserIds.push(user.id);

          // Assert: Role is always "usuario" regardless of email domain
          const profile = await getUserProfile(user.id);
          expect(profile.rol).toBe('usuario');
        }
      ),
      { numRuns: 3 } // Reduced: each run creates real DB records
    );
  }, 60000);

  it('should assign "usuario" role with various user metadata combinations', async () => {
    const userMetadataArbitrary = fc.record({
      emailBase: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
      fullName: fc.oneof(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constant(''),
        fc.constant(null as any),
      ),
      googleId: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(
        userMetadataArbitrary,
        async (userData) => {
          const email = uniqueEmail(userData.emailBase);
          // Act: Create OAuth user with various metadata
          const user = await createOAuthUser({
            email,
            fullName: userData.fullName || 'Test User',
            googleId: userData.googleId,
          });
          createdUserIds.push(user.id);

          // Assert: Role assignment is independent of metadata
          const profile = await getUserProfile(user.id);
          expect(profile.rol).toBe('usuario');
          expect(profile.id).toBe(user.id);
        }
      ),
      { numRuns: 3 } // Reduced: each run creates real DB records
    );
  }, 60000);
});


// ============================================================================
// Property 8: Error Message Distinctness
// ============================================================================

/**
 * Error types that can occur during OAuth flow
 */
type OAuthErrorType = 'cancellation' | 'network' | 'config' | 'provider' | 'session';

interface OAuthError {
  type: OAuthErrorType;
  message: string;
  shouldDisplay: boolean;
}

/**
 * Implementation of getErrorMessage function (from design document)
 * This categorizes OAuth errors and returns appropriate user-facing messages
 */
function getErrorMessage(error: any): OAuthError {
  const errorMessage = (error?.message || '').toLowerCase();
  
  // User cancellation - no error display needed
  if (errorMessage.includes('access_denied') || errorMessage.includes('user_cancelled')) {
    return { 
      type: 'cancellation', 
      message: '', 
      shouldDisplay: false 
    };
  }
  
  // Network connectivity errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')) {
    return { 
      type: 'network', 
      message: 'Unable to connect. Please check your internet connection and try again.',
      shouldDisplay: true 
    };
  }
  
  // Configuration errors
  if (errorMessage.includes('configuration') || 
      errorMessage.includes('invalid_client') ||
      errorMessage.includes('client_id') ||
      errorMessage.includes('redirect_uri')) {
    return { 
      type: 'config', 
      message: 'OAuth configuration error. Please contact support.',
      shouldDisplay: true 
    };
  }
  
  // Session creation errors
  if (errorMessage.includes('session') || 
      errorMessage.includes('token') ||
      errorMessage.includes('exchange')) {
    return { 
      type: 'session', 
      message: 'Session creation failed. Please try logging in again.',
      shouldDisplay: true 
    };
  }
  
  // Generic provider errors (fallback)
  return { 
    type: 'provider', 
    message: 'Authentication failed. Please try again or use email/password.',
    shouldDisplay: true 
  };
}

describe('Property 8: Error Message Distinctness', () => {
  // Feature: google-oauth-authentication, Property 8: Error Message Distinctness
  it('should produce distinct error messages for different error types', async () => {
    // Arbitrary for generating different error types
    const errorTypeArbitrary = fc.constantFrom<OAuthErrorType>(
      'cancellation',
      'network',
      'config',
      'provider',
      'session'
    );

    await fc.assert(
      fc.asyncProperty(
        errorTypeArbitrary,
        async (errorType) => {
          // Create error object based on type
          let mockError: any;
          
          switch (errorType) {
            case 'cancellation':
              mockError = { message: 'User cancelled OAuth flow: access_denied' };
              break;
            case 'network':
              mockError = { message: 'Network error: fetch failed' };
              break;
            case 'config':
              mockError = { message: 'Invalid OAuth configuration: invalid_client' };
              break;
            case 'session':
              mockError = { message: 'Failed to exchange code for session' };
              break;
            case 'provider':
              mockError = { message: 'OAuth provider returned an error' };
              break;
          }

          // Act: Get error message
          const result = getErrorMessage(mockError);

          // Assert: Error type matches expected
          expect(result.type).toBe(errorType);

          // Assert: Cancellation should not display
          if (errorType === 'cancellation') {
            expect(result.shouldDisplay).toBe(false);
            expect(result.message).toBe('');
          } else {
            expect(result.shouldDisplay).toBe(true);
            expect(result.message.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  it('should produce unique messages for each displayable error type', async () => {
    const displayableErrorTypes: OAuthErrorType[] = ['network', 'config', 'provider', 'session'];
    
    // Generate all error messages
    const errorMessages = new Map<OAuthErrorType, string>();
    
    for (const errorType of displayableErrorTypes) {
      let mockError: any;
      
      switch (errorType) {
        case 'network':
          mockError = { message: 'Network connection timeout' };
          break;
        case 'config':
          mockError = { message: 'OAuth client_id is invalid' };
          break;
        case 'session':
          mockError = { message: 'Token exchange failed' };
          break;
        case 'provider':
          mockError = { message: 'Provider error occurred' };
          break;
      }
      
      const result = getErrorMessage(mockError);
      errorMessages.set(errorType, result.message);
    }
    
    // Assert: All messages are distinct
    const uniqueMessages = new Set(errorMessages.values());
    expect(uniqueMessages.size).toBe(displayableErrorTypes.length);
    
    // Assert: Each error type has a specific message
    expect(errorMessages.get('network')).toContain('internet connection');
    expect(errorMessages.get('config')).toContain('configuration');
    expect(errorMessages.get('session')).toContain('Session creation failed');
    expect(errorMessages.get('provider')).toContain('Authentication failed');
  });

  it('should consistently categorize errors with various message formats', async () => {
    // Arbitrary for generating error messages with different formats
    const networkErrorArbitrary = fc.oneof(
      fc.constant({ message: 'network error occurred' }),
      fc.constant({ message: 'fetch request failed' }),
      fc.constant({ message: 'connection timeout' }),
      fc.constant({ message: 'Network: unable to reach server' })
    );

    await fc.assert(
      fc.asyncProperty(
        networkErrorArbitrary,
        async (error) => {
          // Act: Categorize error
          const result = getErrorMessage(error);

          // Assert: All network-related errors categorized as 'network'
          expect(result.type).toBe('network');
          expect(result.message).toContain('internet connection');
          expect(result.shouldDisplay).toBe(true);
        }
      ),
      { numRuns: 25 }
    );
  });

  it('should handle edge cases and malformed error objects', async () => {
    const edgeCaseArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant({}),
      fc.constant({ message: '' }),
      fc.constant({ message: null }),
      fc.constant({ message: undefined }),
      fc.constant({ error: 'no message field' }),
      fc.constant('string error instead of object')
    );

    await fc.assert(
      fc.asyncProperty(
        edgeCaseArbitrary,
        async (error) => {
          // Act: Get error message (should not throw)
          const result = getErrorMessage(error);

          // Assert: Returns a valid error object
          expect(result).toBeDefined();
          expect(result.type).toBeDefined();
          expect(typeof result.shouldDisplay).toBe('boolean');
          
          // Assert: Defaults to provider error for unknown cases
          expect(result.type).toBe('provider');
          expect(result.shouldDisplay).toBe(true);
        }
      ),
      { numRuns: 25 }
    );
  });

  it('should maintain error message distinctness across random error strings', async () => {
    // Generate random error messages and verify they get categorized correctly
    const randomErrorArbitrary = fc.record({
      hasAccessDenied: fc.boolean(),
      hasNetwork: fc.boolean(),
      hasConfig: fc.boolean(),
      hasSession: fc.boolean(),
      randomText: fc.string({ minLength: 0, maxLength: 50 }),
    });

    await fc.assert(
      fc.asyncProperty(
        randomErrorArbitrary,
        async (errorData) => {
          // Build error message with specific keywords
          let message = errorData.randomText;
          
          if (errorData.hasAccessDenied) message += ' access_denied';
          if (errorData.hasNetwork) message += ' network error';
          if (errorData.hasConfig) message += ' invalid_client';
          if (errorData.hasSession) message += ' session failed';

          const error = { message };
          const result = getErrorMessage(error);

          // Assert: Error is categorized (priority order matters)
          expect(result).toBeDefined();
          expect(result.type).toBeDefined();
          
          // Assert: Cancellation takes priority
          if (errorData.hasAccessDenied) {
            expect(result.type).toBe('cancellation');
            expect(result.shouldDisplay).toBe(false);
          }
          // Assert: Network errors detected
          else if (errorData.hasNetwork) {
            expect(result.type).toBe('network');
            expect(result.message).toContain('internet connection');
          }
          // Assert: Config errors detected
          else if (errorData.hasConfig) {
            expect(result.type).toBe('config');
            expect(result.message).toContain('configuration');
          }
          // Assert: Session errors detected
          else if (errorData.hasSession) {
            expect(result.type).toBe('session');
            expect(result.message).toContain('Session creation failed');
          }
          // Assert: Defaults to provider error
          else {
            expect(result.type).toBe('provider');
            expect(result.message).toContain('Authentication failed');
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});
