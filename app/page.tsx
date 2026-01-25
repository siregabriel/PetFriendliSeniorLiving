/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 24, 2026
 *
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 * This code is proprietary and confidential.
 */
// app/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Importamos el Mapa dinámicamente
const Mapa = dynamic(() => import('../components/Mapa'), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading map...</div>
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

// --- ICONOS HERMOSOS (SVG LINE ART) ---
const PetIcons = {
  dog: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
      <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
      <path d="M4.42 11.247A4.335 4.335 0 0 1 6.944 10c.324 0 .638.03.938.087 2.546.48 3.536 2.958 4.078 4.163.542-1.205 1.532-3.683 4.078-4.163.3-.057.614-.087.938-.087a4.331 4.331 0 0 1 2.525 1.247c.482.49.851 1.08 1.053 1.748.156.517.202 1.053.132 1.583a5.558 5.558 0 0 1-2.903 4.346c-1.398.814-2.98.983-4.526.484a2.988 2.988 0 0 0-1.257-.145 2.989 2.989 0 0 0-1.257.145c-1.545.499-3.128.33-4.526-.484a5.558 5.558 0 0 1-2.903-4.346 5.348 5.348 0 0 1 .132-1.583c.202-.667.571-1.257 1.053-1.747Z" />
    </svg>
  ),
  cat: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21S3 17.9 3 13.44C3 12.24 3.43 11.07 4 10c0 0-1.82-6.42-.42-7 1.39-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26Z" />
    </svg>
  ),
  bird: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
    </svg>
  ),
  exotic: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 8a3 3 0 0 0-3 3v2a3 3 0 0 1-6 0v-2a3 3 0 0 0-6 0v2a9 9 0 0 0 18 0V11a3 3 0 0 0-3-3Z" />
    </svg>
  ),
  default: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M12 16c-1.1 0-2-.9-2-2v-1h4v1c0 1.1-.9 2-2 2z" />
       <path d="M5.1 8.3c1.4-2 3.6-3.3 6.9-3.3 3.3 0 5.5 1.3 6.9 3.3.4.6.4 1.5.1 2.1l-1.9 3.8c-.5 1-1.6 1.8-2.9 1.8H9.8c-1.3 0-2.4-.8-2.9-1.8L5 10.4c-.3-.6-.3-1.5.1-2.1z" />
    </svg>
  )
};

// Helper de estilos (Versión Compacta para Cards)
const getPetStyle = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes('dog') || t.includes('perro')) return { 
    Icon: PetIcons.dog, 
    bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600'
  };
  if (t.includes('cat') || t.includes('gato')) return { 
    Icon: PetIcons.cat, 
    bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600'
  };
  if (t.includes('bird') || t.includes('ave')) return { 
    Icon: PetIcons.bird, 
    bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600'
  };
  if (t.includes('exotic') || t.includes('exotico')) return { 
    Icon: PetIcons.exotic, 
    bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600'
  };
  return { 
    Icon: PetIcons.default, 
    bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500'
  };
};

function ContenidoPrincipal() {
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [loading, setLoading] = useState(true);

  // Hooks para leer y escribir en la URL
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ESTADOS INICIALES (URL)
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [filtroMascota, setFiltroMascota] = useState(searchParams.get('mascota') || 'todos');
  const [minPrecio, setMinPrecio] = useState(searchParams.get('min') || '');
  const [maxPrecio, setMaxPrecio] = useState(searchParams.get('max') || '');

  // NUEVO ESTADO: Ciudad seleccionada desde el mapa (Local)
  const [ciudadMapa, setCiudadMapa] = useState<string | null>(null);

  // --- ESTADOS PARA SUGERENCIAS DE BÚSQUEDA ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // --- ESTADO PARA GEOLOCALIZACIÓN ---
  const [locating, setLocating] = useState(false);

  // Función para buscar sugerencias en Mapbox
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    try {
      // Nota: Ajusta 'country=us' si quieres buscar en todo el mundo o en otros países
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place&country=us&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // --- FUNCIÓN DE GEOLOCALIZACIÓN (AJUSTADA: AUTO O MANUAL) ---
  const detectarUbicacion = (esManual = false) => {
    if (!navigator.geolocation) {
      if (esManual) alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        try {
          // Consultamos a Mapbox: "¿Qué ciudad es esta lat/long?"
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,postcode`
          );
          const data = await res.json();

          if (data.features && data.features.length > 0) {
            const cityFeature = data.features.find((f: any) => f.place_type.includes('place'));
            // Usamos solo el nombre de la ciudad para el buscador
            const ciudad = cityFeature ? cityFeature.text : '';

            if (ciudad) {
                setBusqueda(ciudad);
                setCiudadMapa(null); // Limpiamos filtro mapa para enfocar en texto
            } else if (esManual) {
                alert("Could not detect city name.");
            }

          } else if (esManual) {
            alert("Could not detect city name.");
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          if (esManual) alert("Error finding your location.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        // Solo mostramos alerta si el usuario lo pidió manualmente (botón)
        if (esManual) alert("Unable to retrieve your location. Please allow GPS access.");
        setLocating(false);
      }
    );
  };

  // --- EFECTO: GEOLOCALIZACIÓN AUTOMÁTICA AL INICIO ---
  useEffect(() => {
    // Si no hay búsqueda en URL ni en el estado, intentamos geolocalizar (modo silencioso)
    if (!busqueda && !searchParams.get('q')) {
      detectarUbicacion(false);
    }
  }, []); // Se ejecuta una sola vez al montar

  // Carga de datos inicial
  useEffect(() => {
    const fetchComunidades = async () => {
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .eq('aprobado', true)
        .order('destacada', { ascending: false }); // 👑 AQUÍ ESTÁ EL CAMBIO: Destacados primero

      if (error) console.error('Error:', error);
      else setComunidades(data || []);
      setLoading(false);
    };
    fetchComunidades();
  }, []);

  // Sincronizar URL (Búsqueda, Mascota y Precios)
  useEffect(() => {
    const params = new URLSearchParams();
    if (busqueda) params.set('q', busqueda);
    if (filtroMascota !== 'todos') params.set('mascota', filtroMascota);
    if (minPrecio) params.set('min', minPrecio);
    if (maxPrecio) params.set('max', maxPrecio);

    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [busqueda, filtroMascota, minPrecio, maxPrecio, router]);

  // LÓGICA DE FILTRADO (Incluye ciudad del mapa y rango de precios)
  const comunidadesFiltradas = comunidades.filter(c => {
    // 1. Texto
    const textoCoincide = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          c.ciudad.toLowerCase().includes(busqueda.toLowerCase());
    
    // 2. Mascota
    const mascotaCoincide = filtroMascota === 'todos' || c.tipo_mascota.includes(filtroMascota);

    // 3. Ciudad del Mapa
    const ciudadMapaCoincide = ciudadMapa ? c.ciudad === ciudadMapa : true;

    // 4. Rango de Precios
    const precioMinCoincide = minPrecio ? c.precio_desde >= Number(minPrecio) : true;
    const precioMaxCoincide = maxPrecio ? c.precio_desde <= Number(maxPrecio) : true;

    return textoCoincide && mascotaCoincide && ciudadMapaCoincide && precioMinCoincide && precioMaxCoincide;
  });

  // Función para manejar el clic en el mapa
  const handleFiltrarCiudad = (ciudad: string) => {
    setCiudadMapa(ciudad);
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* HEADER / BARRA DE BÚSQUEDA */}
      <div className="bg-white shadow-sm py-8 px-4 mb-8 relative z-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
            Explore Pet Friendly Communities Near You
          </h1>
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* --- INPUT DE BÚSQUEDA CON AUTOCOMPLETADO Y GEOLOCALIZACIÓN --- */}
            <div className="relative flex-[2]">
                <input 
                  type="text"
                  placeholder="🔍 Search by name or city..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
                  value={busqueda}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBusqueda(val);
                    setCiudadMapa(null); // Si escriben, limpiamos el filtro de mapa
                    fetchCitySuggestions(val);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  // Retrasamos el blur para permitir el click en la sugerencia
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />

                {/* Botón GPS */}
                <button 
                  onClick={() => detectarUbicacion(true)} // true = Modo Manual (muestra alertas)
                  disabled={locating}
                  className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                  title="Use my current location"
                >
                  {locating ? (
                    <span className="animate-spin block">↻</span>
                  ) : (
                    <span className="text-xl">📍</span>
                  )}
                </button>

                {/* Dropdown de Sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[100]">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex flex-col border-b border-gray-50 last:border-0"
                        onClick={() => {
                          // Al hacer click, usamos solo el nombre de la ciudad para filtrar
                          setBusqueda(s.text); 
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-bold text-gray-800">{s.text}</span>
                        <span className="text-xs text-gray-400">{s.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Filtros de Precio */}
            <div className="flex gap-2 flex-1">
              <input 
                type="number"
                placeholder="Min Price $"
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={minPrecio}
                onChange={(e) => setMinPrecio(e.target.value)}
              />
              <input 
                type="number"
                placeholder="Max Price $"
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={maxPrecio}
                onChange={(e) => setMaxPrecio(e.target.value)}
              />
            </div>

            {/* Select de Filtro */}
            <select 
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
              value={filtroMascota}
              onChange={(e) => setFiltroMascota(e.target.value)}
            >
              <option value="todos">🐾 All Pets</option>
              <option value="perro">🐶 Only Dogs</option>
              <option value="gato">🐱 Only Cats</option>
              <option value="exoticos">🦜 Exotics</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        
        {/* MAPA */}
        <div className="mb-10 relative z-0">
          <div className="flex justify-between items-end mb-4">
             <h2 className="text-xl font-bold text-gray-700">
               Explore Communities on the Map
             </h2>
             
             {ciudadMapa && (
               <button 
                 onClick={() => setCiudadMapa(null)}
                 className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center gap-1 cursor-pointer"
               >
                 📍 Filtered by: <strong>{ciudadMapa}</strong> (Click to remove X)
               </button>
             )}
          </div>

          <Mapa lugares={comunidades} onFiltrarCiudad={handleFiltrarCiudad} />
        </div>

        {/* LISTA DE TARJETAS */}
        <h3 className="text-lg font-semibold text-gray-600 mb-4">
          {comunidadesFiltradas.length} Communities Found {ciudadMapa ? `in ${ciudadMapa}` : ''}
        </h3>

        {loading ? (
          <p className="text-center text-gray-500">Loading communities...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comunidadesFiltradas.map((comunidad) => (
              <div key={comunidad.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
                <div className="h-48 w-full relative overflow-hidden">
                   <img src={comunidad.imagen_url} alt={comunidad.nombre} className="w-full h-full object-cover"/>
                   
                   {comunidad.destacada && (
                     <>
                        {/* EFECTO DE BRILLO ANIMADO (SHIMMER) */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className="shimmer-effect absolute top-0 -inset-full h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg]" />
                        </div>

                        {/* BADGE DESTACADO ELEGANTE */}
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-amber-200 rounded-full shadow-sm">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] font-bold tracking-widest text-amber-700 uppercase">
                                Featured Listing
                            </span>
                        </div>
                     </>
                   )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800">{comunidad.nombre}</h2>
                  <p className="text-gray-500 mb-2">📍 {comunidad.ciudad}</p>
                  
                  {/* --- ICONOS DE MASCOTAS DESTACADOS (ACTUALIZADO) --- */}
                  <div className="flex gap-2 mb-4 flex-wrap mt-3">
                    {comunidad.tipo_mascota?.map(tipo => {
                      const { Icon, bg, border, text } = getPetStyle(tipo);
                      return (
                        <div key={tipo} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${bg} ${border} ${text} transition-transform hover:scale-105`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">{tipo}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-gray-900 font-bold">${comunidad.precio_desde.toLocaleString()}</span>
                    <Link 
                      href={`/comunidad/${comunidad.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      See more →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mensaje si no hay resultados */}
            {comunidadesFiltradas.length === 0 && (
              <div className="col-span-full text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No communities found with those filters 😢</p>
                <button 
                  onClick={() => {
                    setBusqueda(''); 
                    setFiltroMascota('todos');
                    setMinPrecio('');
                    setMaxPrecio('');
                    setCiudadMapa(null); // También limpiamos el mapa
                  }}
                  className="text-blue-500 mt-2 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ESTILOS PARA LA ANIMACIÓN DEL BRILLO */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-25deg); }
          50% { transform: translateX(150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        .shimmer-effect {
          animation: shimmer 4s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}

// 5. Componente Principal
export default function Home() {
  return (
    <Suspense fallback={<div className="text-center p-10 font-bold text-gray-400">Loading Application...</div>}>
      <ContenidoPrincipal />
    </Suspense>
  );
}