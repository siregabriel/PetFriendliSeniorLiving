// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase
        .from('perfiles')
        .select('nombre, avatar_url, rol')
        .eq('id', userId)
        .single();
      if (data) {
        setProfileName(data.nombre);
        setAvatarUrl(data.avatar_url);
        setRol(data.rol);
      }
    };

    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) fetchProfileData(session.user.id);
    };
    getData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfileData(session.user.id);
      else { setProfileName(null); setAvatarUrl(null); setRol(null); }
    });

    const handleProfileUpdated = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfileData(session.user.id);
    };
    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfileName(null); setAvatarUrl(null); setRol(null);
    router.push('/login');
  };

  let displayName = '';
  if (profileName) {
    const firstWord = profileName.split(' ')[0];
    displayName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  } else if (user?.email) {
    const emailName = user.email.split('@')[0];
    displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
  } else {
    displayName = 'Friend';
  }

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100'
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-sm">🐾</span>
          </div>
          <span className="hidden md:block font-bold text-gray-900 text-[15px] tracking-tight">
            Senior Pet Living
          </span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
            Explore
          </Link>

          {user ? (
            <>
              <Link
                href="/perfil"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white text-sm font-medium text-gray-700"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center border border-gray-100 flex-shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" width={24} height={24} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-bold text-rose-500">{displayName.charAt(0)}</span>
                  )}
                </div>
                <span className="max-w-[120px] truncate hidden sm:block">{displayName}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
              Log in
            </Link>
          )}

          <Link
            href="/publicar"
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">List Community</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
