/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 25, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BotonVolver from '@/components/BotonVolver';

interface Comunidad {
  id: number;
  nombre: string;
  ciudad: string;
  precio_desde: number;
  imagen_url: string;
  aprobado: boolean;
  destacada: boolean;
}

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      // 1. Verificar Usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || '');

      // 2. Cargar SUS comunidades (Filtradas por su ID)
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .eq('user_id', user.id) // 👈 CLAVE: Solo las suyas
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComunidades(data);
      }
      setLoading(false);
    };

    getData();
  }, [router]);

  // Función para Borrar
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;

    const { error } = await supabase
      .from('comunidades')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      // Quitar de la lista visualmente
      setComunidades(comunidades.filter((c) => c.id !== id));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading your profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 mt-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-bold text-blue-600">{userEmail}</span>
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            {/* Nuevo botón para editar perfil */}
            <Link 
              href="/perfil/editar" 
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-full font-bold shadow-sm transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              ⚙️ Edit Profile
            </Link>

            <Link 
              href="/publicar" 
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-gray-200 transition-all hover:-translate-y-1"
            >
              + Add New Property
            </Link>
          </div>
        </div>

        {/* Lista de Propiedades */}
        {comunidades.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">You haven't listed any communities yet</h3>
            <p className="text-gray-400 mb-6">Start by publishing your first pet-friendly home.</p>
            <Link href="/publicar" className="text-blue-600 font-bold hover:underline">Create Listing →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comunidades.map((casa) => (
              <div key={casa.id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 group">
                
                {/* Imagen y Estado */}
                <div className="h-48 relative overflow-hidden">
                  <img src={casa.imagen_url} alt={casa.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  
                  <div className="absolute top-3 right-3">
                    {casa.aprobado ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                        ● Live
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                        ● Pending Review
                      </span>
                    )}
                  </div>
                  
                  {casa.destacada && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                       <span className="text-amber-500 text-xs">★</span>
                       <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Featured</span>
                    </div>
                  )}
                </div>

                {/* Info y Acciones */}
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{casa.nombre}</h3>
                  <p className="text-gray-500 text-sm mb-4">📍 {casa.ciudad}</p>
                  
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
                    <Link 
                      href={`/editar/${casa.id}`} // ⚠️ Crearemos esta página después
                      className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-colors"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(casa.id)}
                      className="flex-1 text-center bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}