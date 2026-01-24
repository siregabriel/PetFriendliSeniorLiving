// app/publicar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Publicar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);

  // --- LÓGICA DE AUTOCOMPLETADO ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estado para detectar qué botón presionó (Gratis o Pago)
  const [tipoPublicacion, setTipoPublicacion] = useState<'gratis' | 'pago'>('gratis');

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    estado: '',
    precio_desde: '',
    telefono: '', 
    email: '',
    descripcion: '',
  });

  const [mascotas, setMascotas] = useState<string[]>([]);

  // Función para buscar sugerencias en Mapbox
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place&country=us&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleMascotaChange = (tipo: string) => {
    if (mascotas.includes(tipo)) {
      setMascotas(mascotas.filter(m => m !== tipo));
    } else {
      setMascotas([...mascotas, tipo]);
    }
  };

  const buscarCoordenadas = async (ciudad: string, estado: string) => {
    try {
      const query = `${ciudad}, ${estado}`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      return null;
    } catch (error) {
      return null;
    }
  };

  const subirImagen = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-comunidades')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('fotos-comunidades')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        let imageUrlFinal = '';

        if (archivo) {
            imageUrlFinal = await subirImagen(archivo);
        } else {
            alert("Please select an image 📸");
            setLoading(false);
            return;
        }

        const coords = await buscarCoordenadas(formData.ciudad, formData.estado);
        const latitudFinal = coords ? coords.lat : 19.4326;
        const longitudFinal = coords ? coords.lon : -99.1332;

        if (!coords) alert("⚠️ We couldn't find that exact city. An approximate location will be used.");

        const { data: nuevaComunidad, error } = await supabase.from('comunidades').insert([
        {
            ...formData,
            precio_desde: Number(formData.precio_desde),
            tipo_mascota: mascotas,
            latitud: latitudFinal,
            longitud: longitudFinal,
            destacada: false,
            imagen_url: imageUrlFinal,
            aprobado: false, 
            pagado: false    
        }
        ])
        .select()
        .single();

        if (error) throw error;
        if (!nuevaComunidad) throw new Error("Could not create the record.");

        // --- 1. ENVÍO DE NOTIFICACIÓN POR CORREO AL ADMIN ---
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'atlasseniorliving123@gmail.com', // Correo del Admin
                    subject: '🚨 New Community Submission!',
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>A new community is waiting for review</h2>
                            <p><strong>Community Name:</strong> ${formData.nombre}</p>
                            <p><strong>City:</strong> ${formData.ciudad}</p>
                            <p><strong>Contact:</strong> ${formData.email}</p>
                            <hr />
                            <p>Go to the Admin Dashboard to approve it.</p>
                        </div>
                    `
                })
            });
        } catch (emailError) {
            console.error("Non-critical error: Could not send admin notification", emailError);
        }

        // --- 2. ENVÍO DE CONFIRMACIÓN AL CLIENTE (NUEVO) ---
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: formData.email, // Correo que el usuario escribió en el formulario
                    subject: 'We received your submission! 🏡',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 20px;">
                            <h1 style="color: #111;">Submission Received</h1>
                            <p>Hi there,</p>
                            <p>We have successfully received your property <strong>"${formData.nombre}"</strong>.</p>
                            <p>Our team is currently reviewing it. You will receive another email once it goes live.</p>
                            <p style="color: #888; font-size: 12px; margin-top: 20px;">Senior Pet Living Team</p>
                        </div>
                    `
                })
            });
        } catch (clientError) {
            console.error("Non-critical error: Could not send client notification", clientError);
        }

        if (tipoPublicacion === 'pago') {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comunidadId: nuevaComunidad.id,
                    nombre: formData.nombre
                })
            });

            const stripeData = await response.json();

            if (stripeData.url) {
                window.location.href = stripeData.url;
            } else {
                alert('⚠️ There was an error connecting to the payment system.');
                setLoading(false);
            }

        } else {
            alert('Property submitted successfully! 🥳\n\nYour publication is free and will pass through a moderator before appearing on the map.');
            router.push('/');
            router.refresh();
        }

    } catch (error: any) {
        console.error(error);
        alert('Error: ' + error.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Publish New Community</h1>
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition">Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name of the Community</label>
            <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition" 
              value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>

          {/* Ubicación con Sugerencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  required 
                  type="text" 
                  autoComplete="off"
                  placeholder="Start typing..."
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition" 
                  value={formData.ciudad} 
                  onChange={e => {
                    setFormData({...formData, ciudad: e.target.value});
                    fetchCitySuggestions(e.target.value);
                    setShowSuggestions(true);
                  }} 
                />
                
                {/* Dropdown de Sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex flex-col border-b border-gray-50 last:border-0"
                        onClick={() => {
                          const cityName = s.text;
                          const stateName = s.context?.find((c: any) => c.id.startsWith('region'))?.text || "";
                          setFormData({ ...formData, ciudad: cityName, estado: stateName });
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-bold text-gray-800">{s.text}</span>
                        <span className="text-xs text-gray-400">{s.place_name.split(',').slice(1).join(',')}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                <input required type="text" className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg outline-none" 
                  value={formData.estado} readOnly placeholder="Auto-filled" />
            </div>
          </div>

          {/* Precio y Foto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Month ($)</label>
                <input required type="number" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition" 
                  value={formData.precio_desde} onChange={e => setFormData({...formData, precio_desde: e.target.value})} />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Photo 📸</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full p-1 border border-gray-200 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        setArchivo(e.target.files[0]);
                    }
                  }} 
                />
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h3 className="font-bold text-gray-700 mb-4 text-xs uppercase tracking-widest">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp 📞</label>
                  <input required type="tel" placeholder="e.g. 1..." className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  <p className="text-[10px] text-gray-400 mt-1">Country code, no spaces.</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email ✉️</label>
                  <input required type="email" placeholder="contact@example.com" className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Mascotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Pets</label>
            <div className="flex gap-4 flex-wrap">
              {['dog', 'cat', 'birds', 'exotic'].map(tipo => (
                <label key={tipo} className={`flex items-center space-x-2 cursor-pointer border px-4 py-2 rounded-xl transition ${mascotas.includes(tipo) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-50 border-gray-100'}`}>
                  <input type="checkbox" 
                    checked={mascotas.includes(tipo)}
                    onChange={() => handleMascotaChange(tipo)}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="capitalize text-sm font-medium text-gray-700">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={4} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition resize-none" 
              value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
          </div>

          {/* --- BOTONES DE ACCIÓN --- */}
          <div className="pt-6 flex flex-col md:flex-row gap-4">
             <button 
                type="submit" 
                onClick={() => setTipoPublicacion('gratis')}
                disabled={loading}
                className="flex-1 bg-white text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 transition border border-gray-200 shadow-sm"
             >
                Publish Free
                <span className="block text-[10px] font-medium opacity-50 mt-1 uppercase tracking-tight">Standard review (24-48h)</span>
             </button>

             <button 
                type="submit" 
                onClick={() => setTipoPublicacion('pago')}
                disabled={loading}
                className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50"
             >
                {loading && tipoPublicacion === 'pago' ? 'Processing...' : 'Pay $4.99 USD'}
                <span className="block text-[10px] font-medium opacity-70 mt-1 uppercase tracking-tight">✨ Highlighted Listing</span>
             </button>
          </div>
          
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6">
            Senior Pet Living Directory Service
          </p>
        </form>
      </div>
    </div>
  );
}