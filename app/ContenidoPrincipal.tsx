// app/ContenidoPrincipal.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { DogIcon, CatIcon, BirdIcon, ExoticIcon, AllPetsIcon } from '@/components/PetIcons';
import RatingSummary from '@/components/RatingSummary';
import { computeSummary } from '@/lib/ratings';
import type { RatingSummaryData } from '@/lib/types/valoracion';

const Mapa = dynamic(() => import('../components/Mapa'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gradient-to-br from-rose-50 to-pink-50 animate-pulse rounded-3xl flex items-center justify-center text-gray-400 text-sm">
      Loading map...
    </div>
  )
});

interface Comunidad {
  id: number;
  nombre: string;
  ciudad: string;
  precio_desde: number;
  tipo_mascota: string[];
  imagen_url: string;
  destacada: boolean;
  latitud?: number;
  longitud?: number;
}

let cachedComunidades: Comunidad[] | null = null;
let cachedUserCity: string | null = null;

const PetIcons = {
  dog: DogIcon,
  cat: CatIcon,
  bird: BirdIcon,
  exotic: ExoticIcon,
  all: AllPetsIcon,
};

const getPetStyle = (tipo: any) => {
  if (!tipo || typeof tipo !== 'string') return { Icon: PetIcons.all, bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500' };
  const t = tipo.toLowerCase();
  if (t.includes('dog')) return { Icon: PetIcons.dog, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' };
  if (t.includes('cat')) return { Icon: PetIcons.cat, bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-500' };
  if (t.includes('bird')) return { Icon: PetIcons.bird, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' };
  if (t.includes('exotic')) return { Icon: PetIcons.exotic, bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' };
  return { Icon: PetIcons.all, bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500' };
};

const categories = [
  { id: 'todos', label: 'All', icon: PetIcons.all, color: 'text-gray-700', active: 'bg-gray-900 text-white', inactive: 'bg-white text-gray-600 hover:bg-gray-50' },
  { id: 'dog', label: 'Dogs', icon: PetIcons.dog, color: 'text-blue-600', active: 'bg-blue-600 text-white', inactive: 'bg-white text-blue-600 hover:bg-blue-50' },
  { id: 'cat', label: 'Cats', icon: PetIcons.cat, color: 'text-orange-500', active: 'bg-orange-500 text-white', inactive: 'bg-white text-orange-500 hover:bg-orange-50' },
  { id: 'bird', label: 'Birds', icon: PetIcons.bird, color: 'text-emerald-600', active: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 hover:bg-emerald-50' },
  { id: 'exotic', label: 'Exotic', icon: PetIcons.exotic, color: 'text-purple-600', active: 'bg-purple-600 text-white', inactive: 'bg-white text-purple-600 hover:bg-purple-50' },
];

function ContenidoPrincipalInner() {
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [filtroMascota, setFiltroMascota] = useState(searchParams.get('mascota') || 'todos');
  const [minPrecio, setMinPrecio] = useState(searchParams.get('min') || '');
  const [maxPrecio, setMaxPrecio] = useState(searchParams.get('max') || '');
  const [ciudadMapa, setCiudadMapa] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [iconAnimKey, setIconAnimKey] = useState<Record<string, number>>({});
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, RatingSummaryData>>({});

  useEffect(() => {
    const stored = localStorage.getItem('spl_favoritos');
    const localIds: number[] = stored ? JSON.parse(stored) : [];
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setFavoritos(new Set(localIds)); return; }
      setUserId(session.user.id);
      const { data } = await supabase.from('favoritos').select('comunidad_id').eq('user_id', session.user.id);
      const remoteIds: number[] = data ? data.map((r: any) => r.comunidad_id) : [];
      const merged = new Set([...localIds, ...remoteIds]);
      setFavoritos(merged);
      const localOnly = localIds.filter(id => !remoteIds.includes(id));
      if (localOnly.length > 0) {
        await supabase.from('favoritos').upsert(
          localOnly.map(id => ({ user_id: session.user.id, comunidad_id: id })),
          { onConflict: 'user_id,comunidad_id' }
        );
        localStorage.removeItem('spl_favoritos');
      }
    };
    init();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation();
    const newFavs = new Set(favoritos);
    const adding = !newFavs.has(id);
    if (adding) {
      newFavs.add(id);
      setAnimatingHearts(prev => [...prev, id]);
      setTimeout(() => setAnimatingHearts(prev => prev.filter(hId => hId !== id)), 1000);
    } else {
      newFavs.delete(id);
    }
    setFavoritos(newFavs);
    if (userId) {
      if (adding) {
        await supabase.from('favoritos').upsert({ user_id: userId, comunidad_id: id }, { onConflict: 'user_id,comunidad_id' });
      } else {
        await supabase.from('favoritos').delete().eq('user_id', userId).eq('comunidad_id', id);
      }
    } else {
      localStorage.setItem('spl_favoritos', JSON.stringify([...newFavs]));
    }
  };

  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place&country=us&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) { console.error(err); }
  };

  const detectarUbicacion = (esManual = false) => {
    if (!esManual && cachedUserCity) { setBusqueda(cachedUserCity); return; }
    if (!navigator.geolocation) { if (esManual) alert("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,postcode`);
        const data = await res.json();
        if (data.features?.length > 0) {
          const cityFeature = data.features.find((f: any) => f.place_type.includes('place'));
          const ciudad = cityFeature ? cityFeature.text : '';
          if (ciudad) { cachedUserCity = ciudad; setBusqueda(ciudad); }
        }
      } catch (e) { if (esManual) alert("Error finding location."); }
      finally { setLocating(false); }
    }, () => { if (esManual) alert("Unable to retrieve location."); setLocating(false); });
  };

  useEffect(() => {
    if (!busqueda && !searchParams.get('q')) {
      if (cachedUserCity) setBusqueda(cachedUserCity);
      else detectarUbicacion(false);
    }
  }, []);

  useEffect(() => {
    const fetchComunidades = async () => {
      if (cachedComunidades) { setComunidades(cachedComunidades); setLoading(false); return; }
      const { data, error } = await supabase.from('comunidades').select('*').eq('aprobado', true).order('destacada', { ascending: false });
      if (error) { setLoading(false); return; }
      if (data) {
        const sanitized: Comunidad[] = data.map((item: any) => ({
          id: item.id, nombre: item.nombre || 'Untitled', ciudad: item.ciudad || '',
          precio_desde: Number(item.precio_desde) || 0,
          tipo_mascota: Array.isArray(item.tipo_mascota) ? item.tipo_mascota : [],
          imagen_url: item.imagen_url || '', destacada: !!item.destacada,
          latitud: Number(item.latitud) || 0, longitud: Number(item.longitud) || 0,
        }));
        setComunidades(sanitized); cachedComunidades = sanitized;

        // Fetch approved rating summaries for all communities
        const { data: ratingsData } = await supabase
          .from('valoraciones')
          .select('comunidad_id, stars')
          .eq('status', 'approved');

        if (ratingsData) {
          const grouped: Record<string, number[]> = {};
          for (const r of ratingsData) {
            if (!grouped[r.comunidad_id]) grouped[r.comunidad_id] = [];
            grouped[r.comunidad_id].push(r.stars);
          }
          const summaries: Record<string, RatingSummaryData> = {};
          for (const [comunidadId, stars] of Object.entries(grouped)) {
            const s = computeSummary(stars);
            if (s) summaries[comunidadId] = s;
          }
          setRatingSummaries(summaries);
        }
      }
      setLoading(false);
    };
    fetchComunidades();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busqueda) params.set('q', busqueda);
    if (filtroMascota !== 'todos') params.set('mascota', filtroMascota);
    if (minPrecio) params.set('min', minPrecio);
    if (maxPrecio) params.set('max', maxPrecio);
    const url = params.toString() ? `/?${params.toString()}` : '/';
    const handle = setTimeout(() => router.replace(url, { scroll: false }), 300);
    return () => clearTimeout(handle);
  }, [busqueda, filtroMascota, minPrecio, maxPrecio, router]);

  const comunidadesFiltradas = comunidades.filter(c => {
    const nombre = c.nombre || ''; const ciudad = c.ciudad || '';
    const listaMascotas = Array.isArray(c.tipo_mascota) ? c.tipo_mascota : [];
    const textoCoincide = nombre.toLowerCase().includes(busqueda.toLowerCase()) || ciudad.toLowerCase().includes(busqueda.toLowerCase());
    const mascotaCoincide = filtroMascota === 'todos' || listaMascotas.some(m => typeof m === 'string' && m.toLowerCase().includes(filtroMascota.toLowerCase()));
    const ciudadMapaCoincide = ciudadMapa ? ciudad === ciudadMapa : true;
    const precioMinCoincide = minPrecio ? c.precio_desde >= Number(minPrecio) : true;
    const precioMaxCoincide = maxPrecio ? c.precio_desde <= Number(maxPrecio) : true;
    return textoCoincide && mascotaCoincide && ciudadMapaCoincide && precioMinCoincide && precioMaxCoincide;
  });

  const handleFiltrarCiudad = (ciudad: string) => { setCiudadMapa(ciudad); window.scrollTo({ top: 500, behavior: 'smooth' }); };

  // ─── HERO BANNER CONFIG (edit here) ───────────────────────────────────────
  const heroBanner = {
    imageUrl: 'https://images.pexels.com/photos/4148995/pexels-photo-4148995.jpeg?auto=compress&cs=tinysrgb&w=1600&fit=max',
    headline: 'Find pet-friendly Independent and Assisted Living communities where you and your beloved companion are welcome.',
    //subtext: 'Hundreds of pet-friendly senior communities across the United States.',
    ctaText: 'Explore Communities',
    enabled: true,
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HERO BANNER */}
      {heroBanner.enabled && (
        <div className="relative w-full" style={{ minHeight: '680px', overflow: 'visible' }}>
          {/* Background image — clipped to hero bounds */}
          <div className="absolute inset-0 overflow-hidden rounded-none">
            <img
              src={heroBanner.imageUrl}
              alt="Senior Pet Living hero"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient overlays — stronger for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* Top content: headline + subtext */}
          <div className="relative z-10 flex flex-col justify-start px-8 md:px-16 max-w-3xl" style={{ paddingTop: '90px', lineHeight: '1' }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-none mb-4 whitespace-pre-line" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {heroBanner.headline}
            </h1>
          </div>

          {/* Search card pinned to bottom of hero — left-aligned under headline */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-start px-8 md:px-16 pb-16" style={{ overflow: 'visible' }}>
            <div className="rounded-3xl px-6 py-5" style={{ width: '560px', maxWidth: '100%', overflow: 'visible', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 0 0 0.5px rgba(255,255,255,0.3)' }}>
              <p className="text-white/80 text-s font-semibold tracking-widest mb-2">Find Your Community</p>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-[3]">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by city..."
                    className="w-full pl-10 pr-14 py-3.5 rounded-2xl outline-none text-gray-800 text-sm shadow-sm transition-all bg-white/95 border-0 focus:ring-2 focus:ring-white/60"
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setCiudadMapa(null); fetchCitySuggestions(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <button onClick={() => detectarUbicacion(true)} disabled={locating} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all" title="Use my location">
                    {locating ? <span className="animate-spin block text-sm">↻</span> : <span className="text-base">📍</span>}
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[100]">
                      {suggestions.map((s, i) => (
                        <button key={i} type="button" className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex flex-col border-b border-gray-50 last:border-0"
                          onClick={() => { setBusqueda(s.text); setSuggestions([]); setShowSuggestions(false); }}>
                          <span className="font-semibold text-gray-800">{s.text}</span>
                          <span className="text-xs text-gray-400">{s.place_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-[1.5]">
                  <div className="relative" style={{ width: '110px', flexShrink: 0 }}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/70 font-medium">Min $</span>
                    <input type="number" className="w-full pl-12 pr-3 py-3.5 bg-white/20 border-0 rounded-2xl focus:ring-2 focus:ring-white/60 outline-none text-white text-sm shadow-sm transition-all" value={minPrecio} onChange={(e) => setMinPrecio(e.target.value)} />
                  </div>
                  <div className="relative" style={{ width: '110px', flexShrink: 0 }}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/70 font-medium">Max $</span>
                    <input type="number" className="w-full pl-12 pr-3 py-3.5 bg-white/20 border-0 rounded-2xl focus:ring-2 focus:ring-white/60 outline-none text-white text-sm shadow-sm transition-all" value={maxPrecio} onChange={(e) => setMaxPrecio(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between gap-2">
                {categories.map((cat) => {
                  const isActive = filtroMascota === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFiltroMascota(cat.id);
                        setIconAnimKey(prev => ({ ...prev, [cat.id]: (prev[cat.id] ?? 0) + 1 }));
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive ? cat.active + ' shadow-sm scale-105' : cat.inactive + ' border border-gray-200'}`}
                      style={isActive ? {} : {}}
                    >
                      <span
                        key={iconAnimKey[cat.id] ?? 0}
                        style={{ display: 'inline-flex', animation: isActive ? 'icon-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none' }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* MAP */}
        <div className="mb-8 relative z-0">
          <button onClick={() => setMapaAbierto(prev => !prev)} className="w-full relative overflow-hidden rounded-2xl transition-all duration-300 group">
            <div className={`absolute inset-0 transition-all duration-300 ${mapaAbierto ? 'bg-gradient-to-r from-slate-100 to-gray-100' : 'bg-gradient-to-r from-slate-50 to-gray-100'}`} />
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none overflow-hidden">
              {['📍','📍','📍','📍','📍','📍','📍','📍','📍','📍','📍','📍'].map((p, i) => (
                <span key={i} className="absolute text-gray-800 text-lg" style={{ left: `${(i % 6) * 18 + 2}%`, top: `${Math.floor(i / 6) * 55 + 10}%`, transform: `rotate(${(i % 3 - 1) * 8}deg)` }}>{p}</span>
              ))}
            </div>
            <div className="relative flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-gray-800 font-bold leading-tight" style={{ fontSize: '28px' }}>Explore on map</p>
                  <p className="text-gray-400 text-xs mt-0.5"style={{fontSize: '14px', fontWeight:'bolder'}} >{comunidadesFiltradas.length} {comunidadesFiltradas.length === 1 ? 'community' : 'communities'} across the US</p>
                </div>
                {ciudadMapa && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs bg-white text-rose-600 border border-rose-100 px-3 py-1 rounded-full shadow-sm">
                    📍 {ciudadMapa}
                    <span role="button" onClick={(e) => { e.stopPropagation(); setCiudadMapa(null); }} className="opacity-50 hover:opacity-100 cursor-pointer ml-0.5">✕</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                <span className="text-gray-600 text-s font-semibold">{mapaAbierto ? 'Hide map' : 'Show map'}</span>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${mapaAbierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </button>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mapaAbierto ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Mapa lugares={comunidades} onFiltrarCiudad={handleFiltrarCiudad} />
            </div>
          </div>
        </div>

        {/* RESULTS HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-500">
            <span className="text-gray-900 font-bold text-base">{comunidadesFiltradas.length}</span> communities found
            {ciudadMapa && <span className="text-rose-500"> in {ciudadMapa}</span>}
          </h3>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-52 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {comunidadesFiltradas.map((comunidad) => {
              const isFav = favoritos.has(comunidad.id);
              const isAnimating = animatingHearts.includes(comunidad.id);
              return (
                <Link key={comunidad.id} href={`/comunidad/${comunidad.id}`} className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift">
                  <div className="h-52 relative overflow-hidden bg-gray-100">
                    <img src={comunidad.imagen_url} alt={comunidad.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button onClick={(e) => toggleFavorite(e, comunidad.id)} className="absolute top-3 right-3 z-30 p-2 rounded-full glass shadow-sm hover:scale-110 active:scale-95 transition-all" style={{ border: '1.5px solid #fbcfe8' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill={isFav ? "#ef4444" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke={isFav ? "#ef4444" : "#fbcfe8"} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      {isAnimating && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="#ef4444" viewBox="0 0 24 24" className="w-5 h-5 animate-float-heart">
                            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        </div>
                      )}
                    </button>
                    {comunidad.destacada && (
                      <>
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                          <div className="shimmer-effect absolute top-0 -inset-full h-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg]" />
                        </div>
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 glass border border-amber-200/60 rounded-full shadow-sm">
                          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-[9px] font-bold tracking-widest text-amber-700 uppercase">Featured</span>
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-3 left-3 z-20">
                      <span className="glass border border-white/40 text-gray-900 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                        ${comunidad.precio_desde.toLocaleString()}<span className="font-normal text-xs text-gray-500">/mo</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="font-semibold text-gray-900 text-[15px] leading-snug">{comunidad.nombre}</h2>
                    </div>
                    {ratingSummaries[comunidad.id] && (
                      <div className="mb-1">
                        <RatingSummary
                          average={ratingSummaries[comunidad.id].average}
                          count={ratingSummaries[comunidad.id].count}
                          size="sm"
                        />
                      </div>
                    )}
                    <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {comunidad.ciudad}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(comunidad.tipo_mascota || []).map(tipo => {
                        const { Icon, bg, border, text } = getPetStyle(tipo);
                        return (
                          <div key={tipo} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${bg} ${border} ${text}`}>
                            <Icon className="w-3 h-3" />
                            <span className="text-[10px] font-semibold capitalize">{tipo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              );
            })}
            {comunidadesFiltradas.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">🐾</div>
                <p className="text-gray-500 font-medium mb-2">No communities found</p>
                <button onClick={() => { setBusqueda(''); setFiltroMascota('todos'); setMinPrecio(''); setMaxPrecio(''); setCiudadMapa(null); }}
                  className="text-rose-500 text-sm font-semibold hover:underline mt-1">Clear all filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-25deg); } 50% { transform: translateX(150%) skewX(-25deg); } 100% { transform: translateX(150%) skewX(-25deg); } }
        @keyframes float-heart { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; } 100% { transform: translateY(-40px) scale(0.5); opacity: 0; } }
        @keyframes icon-pop { 0% { transform: scale(1); } 35% { transform: scale(1.6) translateY(-3px); } 65% { transform: scale(0.9) translateY(0px); } 100% { transform: scale(1.2); } }
        .animate-float-heart { animation: float-heart 0.8s ease-out forwards; }
        .shimmer-effect { animation: shimmer 4s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

export default function ContenidoPrincipal() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-gray-400 text-sm">Loading...</div>}>
      <ContenidoPrincipalInner />
    </Suspense>
  );
}
