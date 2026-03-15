// app/comunidad/[id]/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import BotonVolver from '@/components/BotonVolver';
import MapaDetalle from '@/components/MapaDetalle';
import { DogIcon, CatIcon, BirdIcon, ExoticIcon } from '@/components/PetIcons';
import RatingSummary from '@/components/RatingSummary';
import RatingWidget from '@/components/RatingWidget';
import { computeSummary, sortByDateDesc } from '@/lib/ratings';
import GalleryLightbox from '@/components/GalleryLightbox';
import type { Valoracion } from '@/lib/types/valoracion';

interface Comunidad {
  id: string; nombre: string; imagen_url: string; ciudad: string; estado: string;
  precio_desde: number; tipo_mascota: string[]; descripcion: string;
  telefono: string; email: string; destacada?: boolean;
  latitud: number; longitud: number; galeria_urls?: string[];
}

const getPetStyle = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes('dog')) return { Icon: DogIcon, label: 'Dogs', gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-100', text: 'text-blue-600' };
  if (t.includes('cat')) return { Icon: CatIcon, label: 'Cats', gradient: 'from-orange-50 to-amber-50', border: 'border-orange-100', text: 'text-orange-500' };
  if (t.includes('bird')) return { Icon: BirdIcon, label: 'Birds', gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-600' };
  if (t.includes('exotic')) return { Icon: ExoticIcon, label: 'Exotic', gradient: 'from-purple-50 to-fuchsia-50', border: 'border-purple-100', text: 'text-purple-600' };
  return { Icon: DogIcon, label: 'Pets', gradient: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-600' };
};

export default async function DetalleComunidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use service role client for server-side fetching (bypasses RLS for approved ratings)
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: comunidad, error } = await supabaseServer.from('comunidades').select('*').eq('id', id).single();
  if (error || !comunidad) notFound();

  // Fetch approved ratings server-side
  const { data: approvedRatings } = await supabaseServer
    .from('valoraciones')
    .select('id, stars, review, created_at, user_id, comunidad_id, status, updated_at')
    .eq('comunidad_id', id)
    .eq('status', 'approved');

  const ratings: Valoracion[] = approvedRatings ?? [];
  const sortedRatings = sortByDateDesc(ratings);
  const summary = computeSummary(ratings.map((r) => r.stars));

  const telefonoLimpio = comunidad.telefono ? comunidad.telefono.replace(/\D/g, '') : '';

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">

      {/* HERO */}
      <div className="w-full h-[55vh] md:h-[65vh] relative overflow-hidden">
        <img src={comunidad.imagen_url || '/placeholder-house.jpg'} alt={comunidad.nombre}
          className="w-full h-full object-cover" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

        {/* Back button */}
        <div className="absolute top-5 left-5 z-20">
          <BotonVolver />
        </div>

        {/* Featured badge */}
        {comunidad.destacada && (
          <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 glass border border-amber-200/60 rounded-full shadow-sm">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-[10px] font-bold tracking-widest text-amber-800 uppercase">Featured</span>
          </div>
        )}

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-10 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-2 drop-shadow-sm">
              {comunidad.nombre}
            </h1>
            <p className="text-white/80 text-base md:text-lg flex items-center gap-2">
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {comunidad.ciudad}, {comunidad.estado}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6 md:p-10">

          {/* RATING SUMMARY */}
          {summary && (
            <div className="mb-4">
              <RatingSummary average={summary.average} count={summary.count} size="md" />
            </div>
          )}

          {/* PRICE + PETS ROW */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-8 mb-8 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Starting at</p>
              <p className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                ${comunidad.precio_desde?.toLocaleString()}
                <span className="text-lg font-normal text-gray-400 ml-1">/ mo</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center lg:text-right">Pets welcome</p>
              <div className="flex flex-wrap gap-3">
                {comunidad.tipo_mascota?.map((tipo: string) => {
                  const { Icon, label, gradient, border, text } = getPetStyle(tipo);
                  return (
                    <div key={tipo} className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${gradient} border ${border} hover:shadow-md transition-all hover:-translate-y-0.5`}>
                      <div className={`${text} mb-1.5`}><Icon className="w-7 h-7 md:w-8 md:h-8" /></div>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${text}`}>{label}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 ring-2 ring-white" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

            {/* LEFT: Description + Gallery + Map */}
            <div className="lg:col-span-2 space-y-10">

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">About this community</h3>
                <p className="text-gray-500 leading-relaxed text-[15px] whitespace-pre-line">{comunidad.descripcion}</p>
              </div>

              {/* RATING WIDGET */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Rate this community</h3>
                <RatingWidget comunidadId={id} isAuthenticated={false} />
              </div>

              {/* APPROVED REVIEWS */}
              {sortedRatings.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
                  <div className="space-y-4">
                    {sortedRatings.map((r) => (
                      <div key={r.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-400">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {r.review && <p className="text-gray-600 text-sm leading-relaxed">{r.review}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comunidad.galeria_urls && comunidad.galeria_urls.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Gallery</h3>
                  <GalleryLightbox images={comunidad.galeria_urls} communityName={comunidad.nombre} />
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Location
                  <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{comunidad.ciudad}</span>
                </h3>
                <div className="h-[360px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
                  <MapaDetalle lugares={[comunidad]} />
                </div>
              </div>
            </div>

            {/* RIGHT: Contact sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 sticky top-24">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-5 text-center">Contact this community</h3>

                <div className="space-y-3">
                  {comunidad.telefono && (
                    <a href={`https://wa.me/${telefonoLimpio}?text=Hello, I saw "${comunidad.nombre}" on SeniorPetLiving and I'm interested.`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold py-3.5 px-5 rounded-2xl transition-all shadow-lg shadow-green-100 group">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      WhatsApp Chat
                    </a>
                  )}

                  {comunidad.email && (
                    <a href={`mailto:${comunidad.email}?subject=Inquiry about ${comunidad.nombre}`}
                      className="flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 px-5 rounded-2xl transition-all shadow-lg shadow-gray-200 group">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Send Inquiry
                    </a>
                  )}

                  {!comunidad.email && !comunidad.telefono && (
                    <p className="text-center text-gray-400 text-sm italic">Contact info not available</p>
                  )}
                </div>

                <p className="text-center text-[9px] font-semibold text-gray-300 uppercase tracking-widest mt-6">
                  Listed on Senior Pet Living
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
