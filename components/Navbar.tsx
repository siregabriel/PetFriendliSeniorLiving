// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Función para buscar los datos del perfil
    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setProfileName(data.full_name);
        setAvatarUrl(data.avatar_url);
      }
    };

    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfileData(session.user.id);
      }
    };
    getData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfileData(session.user.id);
      } else {
        setProfileName(null);
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- LÓGICA DE NOMBRE Y FORMATO ---
  let displayName = '';

  if (profileName) {
    // 1. Tomamos solo el primer nombre
    const firstWord = profileName.split(' ')[0];
    // 2. Lo capitalizamos (Primera mayúscula, resto minúscula)
    displayName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  } else if (user?.email) {
    // Si no hay nombre, usamos el email formateado igual
    const emailName = user.email.split('@')[0];
    displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
  } else {
    displayName = 'Friend';
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          🐶 <span className="hidden md:inline">Senior Pet Living Near Me</span>
        </Link>

        {/* ENLACES */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium text-sm">
            Explore
          </Link>

          {user ? (
            <>
              {/* Botón de Perfil */}
              <Link 
                href="/perfil" 
                className="text-sm font-bold text-blue-900 hover:text-blue-700 cursor-pointer border border-blue-100 px-3 py-1.5 rounded-full bg-blue-50 flex items-center gap-2 transition-colors"
              >
                {avatarUrl ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-blue-200">
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-lg">👤</span>
                )}
                
                {/* 👇 AQUÍ ESTÁ EL CAMBIO: Hello Gabriel */}
                <span className="max-w-[150px] truncate pr-1">
                  Hello {displayName}
                </span>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 font-medium text-xs md:text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium text-sm">
              Log In
            </Link>
          )}
          
          <Link 
            href="/publicar" 
            className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-full font-bold hover:bg-blue-700 transition text-xs md:text-sm shadow-sm flex items-center gap-2"
          >
            <span>+</span> <span className="hidden md:inline">Publish a Community</span><span className="md:hidden">Add</span>
          </Link>
        </div>

      </div>
    </nav>
  );
}