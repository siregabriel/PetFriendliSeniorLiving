/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 27, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation'; // useParams para leer el ID de la URL
import BotonVolver from '@/components/BotonVolver';

export default function EditarComunidad() {
  const router = useRouter();
  const params = useParams(); // Obtenemos el ID de la carpeta [id]
  const idComunidad = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    estado: '',
    precio_desde: '',
    telefono: '', 
    email: '',
    descripcion: '',
    imagen_url: '' // Guardamos la URL actual aquí
  });

  const [mascotas, setMascotas] = useState<string[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null); // Por si quiere cambiar la foto

  // 1. CARGAR DATOS EXISTENTES
  useEffect(() => {
    const fetchData = async () => {
      // Verificar usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (!idComunidad) return;

      // Buscar la comunidad en la base de datos
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .eq('id', idComunidad)
        .single();

      if (error || !data) {
        alert('Community not found or permission denied.');
        router.push('/perfil');
        return;
      }

      // Verificar que el usuario sea el dueño (Seguridad extra frontend)
      if (data.user_id !== user.id) {
        alert('You do not have permission to edit this property.');
        router.push('/perfil');
        return;
      }

      // Rellenar el formulario con los datos que bajamos
      setFormData({
        nombre: data.nombre,
        ciudad: data.ciudad,
        estado: data.estado || '',
        precio_desde: data.precio_desde,
        telefono: data.telefono || '',
        email: data.email || '',
        descripcion: data.descripcion || '',
        imagen_url: data.imagen_url
      });
      setMascotas(data.tipo_mascota || []);
      setLoading(false);
    };

    fetchData();
  }, [idComunidad, router]);


  // Helpers
  const handleMascotaChange = (tipo: string) => {
    if (mascotas.includes(tipo)) {
      setMascotas(mascotas.filter(m => m !== tipo));
    } else {
      setMascotas([...mascotas, tipo]);
    }
  };

  const subirImagen = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('fotos-comunidades').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('fotos-comunidades').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // 2. GUARDAR CAMBIOS (UPDATE)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.imagen_url;

      // Si el usuario seleccionó una foto NUEVA, la subimos
      if (archivo) {
        finalImageUrl = await subirImagen(archivo);
      }

      const { error } = await supabase
        .from('comunidades')
        .update({
          nombre: formData.nombre,
          ciudad: formData.ciudad, // Permitimos editar, aunque idealmente se validaría con Mapbox de nuevo
          estado: formData.estado,
          precio_desde: Number(formData.precio_desde),
          telefono: formData.telefono,
          email: formData.email,
          descripcion: formData.descripcion,
          tipo_mascota: mascotas,
          imagen_url: finalImageUrl,
          // No cambiamos 'aprobado' ni 'destacada' ni 'user_id'
        })
        .eq('id', idComunidad);

      if (error) throw error;

      alert('Community updated successfully! ✅');
      router.push('/perfil'); // Volver al dashboard
      router.refresh();

    } catch (error: any) {
      alert('Error updating: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center relative">
      <div className="absolute top-4 left-4">
         <BotonVolver />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl border border-gray-100 mt-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Property</h1>

        <form onSubmit={handleUpdate} className="space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
              value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>

          {/* Ubicación (Simple Text por ahora para simplificar edición) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" 
                  value={formData.ciudad} readOnly title="To change location, please delete and recreate." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" 
                  value={formData.estado} readOnly />
            </div>
          </div>

          {/* Precio y Foto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Month ($)</label>
                <input required type="number" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                  value={formData.precio_desde} onChange={e => setFormData({...formData, precio_desde: e.target.value})} />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full p-1 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) setArchivo(e.target.files[0]);
                  }} 
                />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input required type="tel" className="w-full p-2 border border-gray-200 rounded-lg" 
                    value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full p-2 border border-gray-200 rounded-lg" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
          </div>

          {/* Mascotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Pets</label>
            <div className="flex gap-4 flex-wrap">
              {['dog', 'cat', 'birds', 'exotic'].map(tipo => (
                <label key={tipo} className={`flex items-center space-x-2 cursor-pointer border px-3 py-1 rounded-lg transition ${mascotas.includes(tipo) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100'}`}>
                  <input type="checkbox" checked={mascotas.includes(tipo)} onChange={() => handleMascotaChange(tipo)} className="rounded text-blue-600" />
                  <span className="capitalize text-sm font-medium">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={4} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none" 
              value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
          </div>

          {/* Botón Guardar */}
          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 mt-4"
          >
            {saving ? 'Saving changes...' : 'Update Property'}
          </button>
        
        </form>
      </div>
    </div>
  );
}