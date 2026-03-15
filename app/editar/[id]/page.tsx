'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { DogIcon, CatIcon, BirdIcon, ExoticIcon } from '@/components/PetIcons';

const PET_OPTIONS = [
  { id: 'dog',    label: 'Dogs',   Icon: DogIcon,    color: 'text-blue-500' },
  { id: 'cat',    label: 'Cats',   Icon: CatIcon,    color: 'text-orange-500' },
  { id: 'birds',  label: 'Birds',  Icon: BirdIcon,   color: 'text-emerald-500' },
  { id: 'exotic', label: 'Exotic', Icon: ExoticIcon, color: 'text-purple-500' },
];

export default function EditarComunidad() {
  const router = useRouter();
  const params = useParams();
  const idComunidad = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '', ciudad: '', estado: '', precio_desde: '',
    telefono: '', email: '', descripcion: '', imagen_url: ''
  });

  const [mascotas, setMascotas] = useState<string[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      if (!idComunidad) return;

      const { data, error } = await supabase.from('comunidades').select('*').eq('id', idComunidad).single();
      if (error || !data) { alert('Community not found.'); router.push('/perfil'); return; }
      if (data.user_id !== user.id) { alert('No permission to edit this listing.'); router.push('/perfil'); return; }

      setFormData({
        nombre: data.nombre, ciudad: data.ciudad, estado: data.estado || '',
        precio_desde: data.precio_desde, telefono: data.telefono || '',
        email: data.email || '', descripcion: data.descripcion || '', imagen_url: data.imagen_url
      });
      setMascotas(data.tipo_mascota || []);
      setGaleriaUrls(data.galeria_urls || []);
      setLoading(false);
    };
    fetchData();
  }, [idComunidad, router]);

  const handleMascotaChange = (tipo: string) => {
    if (mascotas.includes(tipo)) setMascotas(mascotas.filter(m => m !== tipo));
    else setMascotas([...mascotas, tipo]);
  };

  const subirImagen = async (file: File) => {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('fotos-comunidades').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('fotos-comunidades').getPublicUrl(fileName).data.publicUrl;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalImageUrl = formData.imagen_url;
      if (archivo) finalImageUrl = await subirImagen(archivo);

      let finalGaleriaUrls = [...galeriaUrls];
      if (galeriaFiles.length > 0) {
        const uploaded = await Promise.all(galeriaFiles.map(f => subirImagen(f)));
        finalGaleriaUrls = [...finalGaleriaUrls, ...uploaded];
      }

      const { error } = await supabase.from('comunidades').update({
        nombre: formData.nombre, ciudad: formData.ciudad, estado: formData.estado,
        precio_desde: Number(formData.precio_desde), telefono: formData.telefono,
        email: formData.email, descripcion: formData.descripcion,
        tipo_mascota: mascotas, imagen_url: finalImageUrl, galeria_urls: finalGaleriaUrls,
      }).eq('id', idComunidad);

      if (error) throw error;
      alert('Community updated! ✅');
      router.push('/perfil'); router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally { setSaving(false); }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-800 transition-all";

  if (loading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edit Listing</h1>
              <p className="text-xs text-gray-400">{formData.nombre}</p>
            </div>
          </div>
          <button onClick={() => router.push('/perfil')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleUpdate} className="space-y-5">

          {/* BASIC INFO */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Community Name</label>
              <input required type="text" className={inputClass} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Price ($)</label>
              <input required type="number" className={inputClass} value={formData.precio_desde} onChange={e => setFormData({...formData, precio_desde: e.target.value})} />
            </div>
          </div>

          {/* LOCATION (read-only) */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" readOnly className={`${inputClass} cursor-not-allowed opacity-60`} value={formData.ciudad} title="To change location, delete and recreate the listing." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <input type="text" readOnly className={`${inputClass} cursor-not-allowed opacity-60`} value={formData.estado} />
              </div>
            </div>
            <p className="text-xs text-gray-400">Location cannot be changed. Delete and recreate to update it.</p>
          </div>

          {/* PHOTOS */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Photos</h2>

            {/* Main photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden hover:border-rose-300 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={(e) => { if (e.target.files?.[0]) { setArchivo(e.target.files[0]); setArchivoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                {archivoPreview ? (
                  <img src={archivoPreview} alt="New preview" className="w-full h-44 object-cover" />
                ) : formData.imagen_url ? (
                  <div className="relative">
                    <img src={formData.imagen_url} alt="Current" className="w-full h-44 object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full">Click to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span className="text-sm">Click to upload</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery <span className="text-gray-400 font-normal">(optional)</span></label>
              {galeriaUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {galeriaUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setGaleriaUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                <span className="text-sm text-gray-500">{galeriaFiles.length > 0 ? `${galeriaFiles.length} new photo(s) selected` : 'Add more photos'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => setGaleriaFiles(Array.from(e.target.files || []).slice(0, 8 - galeriaUrls.length))} />
              </label>
            </div>
          </div>

          {/* CONTACT */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input required type="tel" className={inputClass} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          </div>

          {/* PETS + DESCRIPTION */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</h2>
            <div>
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
              <textarea required rows={5} className={`${inputClass} resize-none`} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
            </div>
          </div>

          {/* SUBMIT */}
          <div className="pb-8">
            <button type="submit" disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-100 disabled:opacity-50 text-sm">
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
