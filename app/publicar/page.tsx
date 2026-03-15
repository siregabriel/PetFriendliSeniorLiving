// app/publicar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DogIcon, CatIcon, BirdIcon, ExoticIcon } from '@/components/PetIcons';
import { Zap, TrendingUp, Eye, ArrowRight, Star } from 'lucide-react';

const PET_OPTIONS = [
  { id: 'dog',    label: 'Dogs',   Icon: DogIcon,    color: 'text-blue-500' },
  { id: 'cat',    label: 'Cats',   Icon: CatIcon,    color: 'text-orange-500' },
  { id: 'birds',  label: 'Birds',  Icon: BirdIcon,   color: 'text-emerald-500' },
  { id: 'exotic', label: 'Exotic', Icon: ExoticIcon, color: 'text-purple-500' },
];

export default function Publicar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tipoPublicacion, setTipoPublicacion] = useState<'gratis' | 'pago'>('gratis');
  const [formData, setFormData] = useState({ nombre: '', ciudad: '', estado: '', precio_desde: '', telefono: '', email: '', descripcion: '' });
  const [mascotas, setMascotas] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('You must be logged in to publish.'); router.push('/login'); }
      else setUserId(user.id);
    };
    checkUser();
  }, [router]);

  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place&country=us&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) { console.error(err); }
  };

  const handleMascotaChange = (tipo: string) => {
    if (mascotas.includes(tipo)) setMascotas(mascotas.filter(m => m !== tipo));
    else setMascotas([...mascotas, tipo]);
  };

  const buscarCoordenadas = async (ciudad: string, estado: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${ciudad}, ${estado}`)}`);
      const data = await res.json();
      if (data?.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch { }
    return null;
  };

  const subirImagen = async (file: File) => {
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('fotos-comunidades').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('fotos-comunidades').getPublicUrl(fileName).data.publicUrl;
  };

  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    setGaleriaFiles(files);
    setGaleriaPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeGaleriaPhoto = (index: number) => {
    setGaleriaFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      if (!archivo) { alert('Please select a main photo 📸'); setLoading(false); return; }
      const imageUrlFinal = await subirImagen(archivo);
      const galeriaUrls = galeriaFiles.length > 0 ? await Promise.all(galeriaFiles.map(f => subirImagen(f))) : [];
      const coords = await buscarCoordenadas(formData.ciudad, formData.estado);
      if (!coords) alert('⚠️ Could not find exact city. Approximate location will be used.');

      const { data: nuevaComunidad, error } = await supabase.from('comunidades').insert([{
        ...formData, precio_desde: Number(formData.precio_desde), tipo_mascota: mascotas,
        latitud: coords?.lat ?? 19.4326, longitud: coords?.lon ?? -99.1332,
        destacada: false, imagen_url: imageUrlFinal, galeria_urls: galeriaUrls,
        aprobado: false, pagado: false, user_id: userId,
      }]).select().single();

      if (error) throw error;
      if (!nuevaComunidad) throw new Error('Could not create the record.');

      // Admin notification
      try {
        await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'atlasseniorliving123@gmail.com', subject: '🚨 New Community Submission!',
            html: `<div style="font-family:sans-serif"><h2>New community pending review</h2><p><strong>${formData.nombre}</strong> — ${formData.ciudad}</p></div>` }) });
      } catch { }

      // Client confirmation
      try {
        await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: formData.email, subject: 'We received your submission! 🏡',
            html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px"><h1>Submission Received</h1><p>We received <strong>"${formData.nombre}"</strong> and will review it shortly.</p><p style="color:#888;font-size:12px">Senior Pet Living Team</p></div>` }) });
      } catch { }

      if (tipoPublicacion === 'pago') {
        const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comunidadId: nuevaComunidad.id, nombre: formData.nombre }) });
        const stripeData = await response.json();
        if (stripeData.url) { window.location.href = stripeData.url; }
        else { alert('⚠️ Error connecting to payment system.'); setLoading(false); }
      } else {
        alert('Property submitted! 🥳\nIt will appear on the map after review.');
        router.push('/perfil'); router.refresh();
      }
    } catch (error: any) {
      alert('Error: ' + error.message); setLoading(false);
    }
  };

  if (!userId) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-800 transition-all";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Publish a Community</h1>
              <p className="text-xs text-gray-400">Fill in the details below</p>
            </div>
          </div>
          <Link href="/perfil" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* BASIC INFO */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Community Name</label>
                <input required type="text" placeholder="e.g. Sunset Villa Senior Living" className={inputClass}
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Price ($)</label>
                <input required type="number" placeholder="2500" className={inputClass}
                  value={formData.precio_desde} onChange={e => setFormData({...formData, precio_desde: e.target.value})} />
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input required type="text" autoComplete="off" placeholder="Start typing..." className={inputClass}
                  value={formData.ciudad}
                  onChange={e => { setFormData({...formData, ciudad: e.target.value}); fetchCitySuggestions(e.target.value); setShowSuggestions(true); }} />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex flex-col border-b border-gray-50 last:border-0"
                        onClick={() => { setFormData({...formData, ciudad: s.text, estado: s.context?.find((c: any) => c.id.startsWith('region'))?.text || ''}); setShowSuggestions(false); }}>
                        <span className="font-semibold text-gray-800">{s.text}</span>
                        <span className="text-xs text-gray-400">{s.place_name.split(',').slice(1).join(',')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <input type="text" readOnly placeholder="Auto-filled" className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
                  value={formData.estado} />
              </div>
            </div>
          </div>

          {/* PHOTOS */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Photos</h2>

            {/* Main photo */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Photo</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden hover:border-rose-300 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={(e) => { if (e.target.files?.[0]) { setArchivo(e.target.files[0]); setArchivoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                {archivoPreview ? (
                  <img src={archivoPreview} alt="Preview" className="w-full h-48 object-cover" />
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span className="text-sm font-medium">Click to upload cover photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery <span className="text-gray-400 font-normal">(optional, up to 8)</span></label>
              {galeriaPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {galeriaPreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGaleriaPhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                <span className="text-sm text-gray-500">{galeriaFiles.length > 0 ? `${galeriaFiles.length} photo(s) selected` : 'Add gallery photos'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGaleriaChange} />
              </label>
            </div>
          </div>

          {/* CONTACT */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Contact Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input required type="tel" placeholder="+1..." className={inputClass}
                  value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                <p className="text-[11px] text-gray-400 mt-1">Include country code, no spaces</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input required type="email" placeholder="contact@example.com" className={inputClass}
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          </div>

          {/* PETS + DESCRIPTION */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Details</h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2.5">Allowed Pets</label>
              <div className="flex gap-2.5 flex-wrap">
                {PET_OPTIONS.map(({ id, label, Icon, color }) => (
                  <label key={id} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${mascotas.includes(id) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="checkbox" checked={mascotas.includes(id)} onChange={() => handleMascotaChange(id)} className="hidden" />
                    <Icon className={`w-4 h-4 ${mascotas.includes(id) ? 'text-rose-500' : color}`} />
                    <span className="capitalize text-sm font-medium">{label}</span>
                    {mascotas.includes(id) && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea required rows={5} placeholder="Describe the community, amenities, pet policies..." className={`${inputClass} resize-none`}
                value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
            </div>
          </div>

          {/* SUBMIT — PRICING CARDS */}
          <div className="pb-8 space-y-3">

            {/* FEATURED — primary CTA */}
            <div className="relative rounded-3xl overflow-hidden" style={{ background: '#e5e7eb', padding: '2px' }}>
              <div className="rounded-[22px] overflow-hidden" style={{ background: '#f3f4f6' }}>
                {/* "Most popular" badge */}
                <div className="flex justify-center pt-5">
                  <span className="flex items-center gap-1.5 bg-gray-800 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                    Most popular
                  </span>
                </div>
                <div className="px-8 pt-5 pb-2 text-center">
                  <p className="text-gray-500 text-sm font-medium mb-1">Featured listing</p>
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-5xl font-black text-gray-900">$4.99</span>
                    <span className="text-gray-400 text-sm">USD</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-6">one-time · no subscription</p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { Icon: Zap, label: 'Listed in 12h', color: '#f59e0b' },
                      { Icon: TrendingUp, label: 'Top positions', color: '#10b981' },
                      { Icon: Eye, label: '3× more views', color: '#6366f1' },
                    ].map(({ Icon, label, color }) => (
                      <div key={label} className="bg-white rounded-2xl py-6 px-2 flex flex-col items-center gap-3 shadow-sm border border-gray-100">
                        <Icon className="w-10 h-10" style={{ color: '#374151' }} strokeWidth={1.75} />
                        <span className="text-gray-700 text-base font-semibold leading-tight text-center">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button type="submit" onClick={() => setTipoPublicacion('pago')} disabled={loading}
                    className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)' }}>
                    {loading && tipoPublicacion === 'pago'
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Processing...</span>
                      : <span className="flex items-center justify-center gap-2"><Zap className="w-5 h-5" fill="currentColor" />Get Featured Now</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* FREE — secondary */}
            <button type="submit" onClick={() => setTipoPublicacion('gratis')} disabled={loading}
              className="w-full group flex items-center justify-between px-6 py-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50">
              <div className="text-left">
                <p className="text-xl font-semibold text-gray-700">Publish for free</p>
                <p className="text-xs text-gray-400 mt-0.5">Standard review · appears in 24–48h</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
