/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 25, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// 👇 Importamos el botón para mantener consistencia
import BotonVolver from '@/components/BotonVolver';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 👇 Estados nuevos para manejar Registro vs Login y Mensajes
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('✅ Account created! You can now log in.');
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Redirigimos al Home (/) para que el usuario vea su perfil en el Navbar
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Botón flotante para regresar */}
      <div className="absolute top-8 left-8">
        <BotonVolver />
      </div>

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {isSignUp ? 'Join the Community' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 font-medium">
            {isSignUp ? 'Create an account to list your property' : 'Login to manage your listings'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-gray-900 focus:outline-none transition-colors font-medium text-gray-800"
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-gray-900 focus:outline-none transition-colors font-medium text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Mensajes de Error/Éxito */}
          {message && (
            <div className={`p-4 rounded-xl text-sm font-bold ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-gray-200"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-8">
          <p className="text-gray-500 text-sm font-medium">
            {isSignUp ? 'Already have an account?' : 'New to SeniorPetLiving?'}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="ml-2 font-bold text-gray-900 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}