/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isConfigValid, setIsConfigValid] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) setIsConfigValid(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('✅ Account created! You can now log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally { setLoading(false); }
  };

  const getErrorMessage = (error: any): { message: string; shouldDisplay: boolean } => {
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('access_denied') || msg.includes('user_cancelled')) return { message: '', shouldDisplay: false };
    if (msg.includes('network') || msg.includes('fetch')) return { message: 'Unable to connect. Check your internet connection.', shouldDisplay: true };
    if (msg.includes('configuration') || msg.includes('invalid_client')) return { message: 'OAuth configuration error. Please contact support.', shouldDisplay: true };
    return { message: 'Authentication failed. Please try again.', shouldDisplay: true };
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true); setOauthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: 'offline', prompt: 'consent' } }
    });
    if (error) {
      const { message, shouldDisplay } = getErrorMessage(error);
      if (shouldDisplay) setOauthError(message);
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">

      {/* Back link */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        Back
      </Link>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignUp ? 'Join Senior Pet Living today' : 'Sign in to manage your listings'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/80 border border-gray-100 p-8">

          {/* Google Button */}
          <button onClick={handleGoogleSignIn} disabled={oauthLoading || !isConfigValid}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            aria-label="Sign in with Google">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {oauthLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400 font-medium uppercase tracking-wider">or</span></div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-800 transition-all"
                placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-800 transition-all"
                placeholder="••••••••" />
            </div>

            {(message || oauthError) && (
              <div className={`p-3 rounded-xl text-sm font-medium ${(message || '').startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message || oauthError}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-sm mt-1">
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsSignUp(!isSignUp); setMessage(null); setOauthError(null); }}
              className="ml-1.5 font-semibold text-rose-500 hover:text-rose-600 transition-colors">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
