/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Comunidad {
  id: number; nombre: string; ciudad: string;
  precio_desde: number; imagen_url: string; aprobado: boolean; destacada: boolean;
}

interface FavoritaComunidad {
  id: number; nombre: string; ciudad: string;
  precio_desde: number; imagen_url: string; destacada: boolean;
}

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [favoritas, setFavoritas] = useState<FavoritaComunidad[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'saved'>('listings');

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/login'); return; }
      const user = session.user;
      setUserEmail(user.email || '');
      setUserId(user.id);

      // Fetch own listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('comunidades')
        .select('id, nombre, ciudad, precio_desde, imagen_url, aprobado, destacada')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!listingsError && listingsData) setComunidades(listingsData);

      // Fetch favorited communities via join
      const { data: favsData } = await supabase
        .from('favoritos')
        .select('comunidad_id, comunidades(id, nombre, ciudad, precio_desde, imagen_url, destacada)')
        .eq('user_id', user.id);
      if (favsData) {
        const favComunidades = favsData
          .map((f: any) => f.comunidades)
          .filter(Boolean) as FavoritaComunidad[];
        setFavoritas(favComunidades);
      }

      setLoading(false);
    };
    getData();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    const { error } = await supabase.from('comunidades').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else setComunidades(comunidades.filter((c) => c.id !== id));
  };

  const handleUnfavorite = async (id: number) => {
    if (!userId) return;
    await supabase.from('favoritos').delete().eq('user_id', userId).eq('comunidad_id', id);
    setFavoritas(prev => prev.filter(f => f.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayEmail = userEmail?.split('@')[0] || 'there';
  const initials = displayEmail.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* PROFILE HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-md">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-sm text-gray-400 mt-0.5">{userEmail}</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Link href="/perfil/editar"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all shadow-sm hover:shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Settings
              </Link>
              <Link href="/publicar"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                Add Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total listings', value: comunidades.length },
            { label: 'Live', value: comunidades.filter(c => c.aprobado).length },
            { label: 'Featured', value: comunidades.filter(c => c.destacada).length },
            { label: 'Saved', value: favoritas.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'listings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            My Listings
            {comunidades.length > 0 && (
              <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{comunidades.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'saved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-4 h-4" fill={activeTab === 'saved' ? '#ef4444' : 'none'} stroke={activeTab === 'saved' ? '#ef4444' : 'currentColor'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
            Saved
            {favoritas.length > 0 && (
              <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{favoritas.length}</span>
            )}
          </button>
        </div>

        {/* MY LISTINGS TAB */}
        {activeTab === 'listings' && (
          comunidades.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-5xl mb-4">🏡</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-6">Start by publishing your first pet-friendly community.</p>
              <Link href="/publicar" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all">
                Create Listing →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {comunidades.map((casa) => (
                <div key={casa.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift group">
                  <div className="h-44 relative overflow-hidden bg-gray-100">
                    <img src={casa.imagen_url} alt={casa.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        casa.aprobado
                          ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200 backdrop-blur-sm'
                          : 'bg-amber-50/90 text-amber-700 border-amber-200 backdrop-blur-sm'
                      }`}>
                        {casa.aprobado ? '● Live' : '● Pending'}
                      </span>
                    </div>
                    {casa.destacada && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 glass border border-amber-200/60 px-2.5 py-1 rounded-full">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Featured</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{casa.nombre}</h3>
                    <p className="text-gray-400 text-sm mb-4 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                      {casa.ciudad}
                    </p>
                    <div className="flex gap-2 pt-4 border-t border-gray-50">
                      <Link href={`/editar/${casa.id}`}
                        className="flex-1 text-center py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs uppercase tracking-wide transition-colors">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(casa.id)}
                        className="flex-1 text-center py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs uppercase tracking-wide transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          favoritas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-5xl mb-4">🤍</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No saved communities yet</h3>
              <p className="text-gray-400 text-sm mb-6">Tap the heart on any listing to save it here.</p>
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all">
                Browse Communities →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoritas.map((fav) => (
                <Link key={fav.id} href={`/comunidad/${fav.id}`} className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift">
                  <div className="h-44 relative overflow-hidden bg-gray-100">
                    <img src={fav.imagen_url} alt={fav.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                    {/* Unfavorite button */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnfavorite(fav.id); }}
                      className="absolute top-3 right-3 p-2 rounded-full glass border border-white/50 shadow-sm hover:scale-110 active:scale-95 transition-all"
                      title="Remove from saved"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="#ef4444" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>

                    {fav.destacada && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 glass border border-amber-200/60 px-2.5 py-1 rounded-full">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Featured</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3">
                      <span className="glass border border-white/40 text-gray-900 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                        ${fav.precio_desde.toLocaleString()}<span className="font-normal text-xs text-gray-500">/mo</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{fav.nombre}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                      {fav.ciudad}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
