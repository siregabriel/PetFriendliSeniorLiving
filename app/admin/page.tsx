// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // Import useRouter

// --- DATA TYPES ---
interface Comunidad {
  id: number;
  nombre: string;
  ciudad: string;
  estado: string;
  precio_desde: number;
  telefono: string;
  email: string;
  descripcion: string;
  aprobado: boolean;
  pagado: boolean;
  imagen_url: string;
  tipo_mascota: string[];
}

interface Perfil {
  id: string;
  email: string;
  rol: 'usuario' | 'admin' | 'super_admin';
}

// --- ICONOS SVG ---
const IconUsers = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const IconList = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const IconEdit = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IconTrash = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconCheck = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const IconX = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconLogout = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

export default function AdminDashboard() {
  const router = useRouter(); 
  
  // --- ESTADOS ---
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [miRol, setMiRol] = useState<string>(''); 
  const [miId, setMiId] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'formulario' | 'usuarios'>('tabla');
  
  // AUTOCOMPLETE STATE
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form Properties
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mascotas, setMascotas] = useState<string[]>([]);
  
  // Form Users
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', rol: 'admin' });
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Initial Form State
  const initialFormState = {
    nombre: '', ciudad: '', estado: '', precio_desde: '', 
    telefono: '', email: '', descripcion: '', imagen_url: '',
    aprobado: true, 
    pagado: true    
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- LOGICA ---

  // Fetch Suggestions from Mapbox
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
      console.error("Geocoding error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMiId(user.id);
        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
        setMiRol(perfil?.rol || 'usuario');
      } else {
        router.push('/login');
      }
      await fetchComunidades();
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); 
    router.refresh();
  };

  const fetchComunidades = async () => {
    const { data } = await supabase.from('comunidades').select('*').order('id', { ascending: false });
    setComunidades(data || []);
  };

  const fetchUsuarios = async () => {
    if (miRol !== 'super_admin') return;
    const { data } = await supabase.from('perfiles').select('*').order('email');
    setUsuarios(data || []); 
  };

  const cambiarRol = async (idUsuario: string, nuevoRol: string) => {
    if (miRol !== 'super_admin') return alert("No permissions.");
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', idUsuario);
    if (error) alert("Error: " + error.message);
    else { alert("Role updated successfully!"); fetchUsuarios(); }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoUsuario(true);
    try {
        const response = await fetch('/api/crear-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newUserForm, adminId: miId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        alert('User created successfully!');
        setNewUserForm({ email: '', password: '', rol: 'admin' });
        fetchUsuarios();
    } catch (error: any) { alert(error.message); } 
    finally { setCreandoUsuario(false); }
  };

  const handleEditar = (c: Comunidad) => {
    setEditingId(c.id);
    setFormData({
      nombre: c.nombre, ciudad: c.ciudad, estado: c.estado, 
      precio_desde: String(c.precio_desde), telefono: c.telefono || '', 
      email: c.email || '', descripcion: c.descripcion, imagen_url: c.imagen_url,
      aprobado: c.aprobado, pagado: c.pagado
    });
    setMascotas(c.tipo_mascota || []);
    setVistaActual('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setVistaActual('tabla');
    setEditingId(null);
    setFormData(initialFormState);
    setMascotas([]);
    setArchivo(null);
    setShowSuggestions(false);
  };

  const handleMascotaChange = (tipo: string) => {
    if (mascotas.includes(tipo)) setMascotas(mascotas.filter(m => m !== tipo));
    else setMascotas([...mascotas, tipo]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let imageUrlFinal = formData.imagen_url;
      if (archivo) {
        const fileName = `${Date.now()}.${archivo.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('fotos-comunidades').upload(fileName, archivo);
        if (error) throw error;
        const { data } = supabase.storage.from('fotos-comunidades').getPublicUrl(fileName);
        imageUrlFinal = data.publicUrl;
      }

      const datosParaGuardar = {
        ...formData, precio_desde: Number(formData.precio_desde), 
        tipo_mascota: mascotas, imagen_url: imageUrlFinal
      };

      if (editingId) {
        await supabase.from('comunidades').update(datosParaGuardar).eq('id', editingId);
        
        // --- NOTIFICACIÓN POR CORREO AL USUARIO SI SE APRUEBA ---
        if (formData.aprobado && formData.email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: formData.email,
                subject: '🎉 Your Property is now LIVE on Senior Pet Living!',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 20px;">
                    <h1 style="color: #111;">Good news!</h1>
                    <p>Your property <strong>"${formData.nombre}"</strong> has been reviewed and approved by our team.</p>
                    <p>It is now visible to seniors looking for pet-friendly homes on our map.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 30px;">Thank you for being part of Senior Pet Living.</p>
                  </div>
                `
              })
            });
          } catch (e) { console.error("Email notification failed", e); }
        }

        alert('Saved successfully.');
      } else {
        await supabase.from('comunidades').insert([{ ...datosParaGuardar, latitud: 19.43, longitud: -99.13, destacada: false }]);
        alert('Created successfully.');
      }
      handleCancelar();
      fetchComunidades();
    } catch (error: any) { alert('Error: ' + error.message); } 
    finally { setSubiendo(false); }
  };

  const toggleAprobado = async (id: number, estadoActual: boolean) => {
    const { error } = await supabase.from('comunidades').update({ aprobado: !estadoActual }).eq('id', id);
    if (!error) {
      // --- NOTIFICACIÓN SI SE CAMBIA A APROBADO (Quick Action) ---
      if (!estadoActual) {
        const comunidad = comunidades.find(c => c.id === id);
        if (comunidad?.email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: comunidad.email,
                subject: '🎉 Your Property is now LIVE on Senior Pet Living!',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 20px;">
                    <h1 style="color: #111;">Your Property is Approved!</h1>
                    <p>Your listing <strong>"${comunidad.nombre}"</strong> is now live on our map.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 30px;">Senior Pet Living Team</p>
                  </div>
                `
              })
            });
          } catch (e) { console.error("Email notification failed", e); }
        }
      }
      fetchComunidades();
    }
  };

  const eliminarComunidad = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('comunidades').delete().eq('id', id);
    fetchComunidades();
  };

  // --- RENDER ---
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-4 bg-gray-300 rounded-full mb-2"></div>
            <p className="text-gray-400 text-sm font-medium tracking-wide">LOADING ADMIN...</p>
        </div>
    </div>
  );

  if (miRol === 'usuario') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-4v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">You do not have permission to view this dashboard.</p>
                <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition">Back to Login</button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans">
      
      {/* NAVBAR SUPERIOR ELEGANTE */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-gray-900 text-white p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">Admin<span className="text-gray-400 font-normal">Dashboard</span></h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                    <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-500 uppercase tracking-wider">{miRol.replace('_', ' ')}</span>
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                        <img src={`https://ui-avatars.com/api/?name=${miRol}&background=random&color=fff`} alt="Avatar" />
                    </div>
                </div>
                
                {/* LOGOUT BUTTON */}
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    title="Sign Out"
                >
                    <IconLogout /> <span className="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* TABS DE NAVEGACIÓN */}
        <div className="flex justify-center mb-10">
            <div className="bg-gray-100/80 p-1 rounded-xl inline-flex shadow-inner">
                <button 
                    onClick={() => setVistaActual('tabla')} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${vistaActual === 'tabla' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   <IconList /> Property
                </button>
                <button 
                    onClick={() => { setVistaActual('formulario'); setEditingId(null); setFormData(initialFormState); }} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${vistaActual === 'formulario' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   <IconPlus /> New Property
                </button>
                {miRol === 'super_admin' && (
                    <button 
                        onClick={() => { setVistaActual('usuarios'); fetchUsuarios(); }} 
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${vistaActual === 'usuarios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                       <IconUsers /> Team
                    </button>
                )}
            </div>
        </div>

        {/* --- VISTA 1: USUARIOS --- */}
        {vistaActual === 'usuarios' && miRol === 'super_admin' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario Crear Usuario */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider">Invite Member</h3>
                        <form onSubmit={handleCrearUsuario} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Email Address</label>
                                <input required type="email" placeholder="colleague@company.com" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-200 transition-all text-sm outline-none" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Password</label>
                                <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-200 transition-all text-sm outline-none" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Role Permission</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-200 transition-all text-sm outline-none appearance-none" value={newUserForm.rol} onChange={e => setNewUserForm({...newUserForm, rol: e.target.value as any})} >
                                        <option value="usuario">User (Read Only)</option>
                                        <option value="admin">Moderator</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                    <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                                </div>
                            </div>
                            <button type="submit" disabled={creandoUsuario} className="w-full mt-2 bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-gray-200 disabled:opacity-50 text-sm">
                                {creandoUsuario ? 'Processing...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Lista de Usuarios */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-sm font-semibold text-gray-600">Active Members</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                                    <tr><th className="px-6 py-4 font-medium">User</th><th className="px-6 py-4 font-medium">Role</th><th className="px-6 py-4 font-medium">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {usuarios.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                        {u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{u.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${u.rol === 'super_admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 
                                                      u.rol === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-600'}`}>
                                                    {u.rol.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    className="bg-transparent text-sm text-gray-500 border-b border-gray-200 focus:border-gray-900 focus:ring-0 py-1 pr-8 cursor-pointer outline-none transition-colors"
                                                    value={u.rol}
                                                    onChange={(e) => cambiarRol(u.id, e.target.value)}
                                                    disabled={u.id === miId}
                                                >
                                                    <option value="usuario">User</option>
                                                    <option value="admin">Moderator</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* --- VISTA 2: FORMULARIO PROPIEDAD (WITH AUTOCOMPLETE) --- */}
        {vistaActual === 'formulario' && (
          <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-50">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingId ? 'Edit Property' : 'New Listing'}</h2>
                    <p className="text-gray-400 text-sm mt-1">Fill in the details below to publish.</p>
                </div>
                {editingId && (
                     <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${formData.pagado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                            {formData.pagado ? 'Paid Plan' : 'Free Plan'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${formData.aprobado ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {formData.aprobado ? 'Published' : 'Pending'}
                        </span>
                     </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               
               <div className="space-y-6">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Core Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Property Name</label>
                            <input type="text" placeholder="e.g. Sunset Villa" required className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Monthly Price ($)</label>
                            <input type="number" placeholder="0.00" required className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none" value={formData.precio_desde} onChange={e => setFormData({...formData, precio_desde: e.target.value})} />
                        </div>
                   </div>
               </div>

               {/* AUTOCOMPLETE LOCATION SECTION */}
               <div className="space-y-6 pt-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location & Contact</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-gray-700">City</label>
                        <input 
                            type="text" 
                            autoComplete="off"
                            placeholder="Start typing city name..." 
                            required 
                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none" 
                            value={formData.ciudad} 
                            onChange={e => {
                                setFormData({...formData, ciudad: e.target.value});
                                fetchCitySuggestions(e.target.value);
                                setShowSuggestions(true);
                            }} 
                        />
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                                        onClick={() => {
                                            const city = s.text;
                                            const state = s.context?.find((c: any) => c.id.startsWith('region'))?.text || "";
                                            setFormData({ ...formData, ciudad: city, estado: state });
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
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">State / Region (Auto-filled)</label>
                        <input type="text" readOnly className="w-full px-4 py-3 bg-gray-100 border-transparent rounded-xl text-gray-400 text-sm outline-none cursor-not-allowed" value={formData.estado} placeholder="Auto-filled" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone / WhatsApp</label>
                        <input type="text" placeholder="+1..." className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" placeholder="contact@..." className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                     </div>
                   </div>
               </div>

               <div className="space-y-6 pt-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Media & Details</h3>
                   <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                      <input type="file" accept="image/*" onChange={e => e.target.files && setArchivo(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center">
                          {editingId && formData.imagen_url && !archivo ? (
                              <img src={formData.imagen_url} className="h-32 w-full object-cover rounded-lg mb-2" alt="Current" />
                          ) : (
                              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-gray-400"><IconPlus /></div>
                          )}
                          <p className="text-sm font-medium text-gray-600">{archivo ? archivo.name : 'Click to upload cover image'}</p>
                      </div>
                   </div>

                   <div>
                       <label className="text-sm font-medium text-gray-700 mb-3 block">Allowed Pets</label>
                       <div className="flex flex-wrap gap-3">
                           {['dog', 'cat', 'exotic'].map(t => (
                               <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all border ${mascotas.includes(t) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                   <input type="checkbox" className="hidden" checked={mascotas.includes(t)} onChange={() => handleMascotaChange(t)} /> 
                                   <span className="capitalize text-sm font-medium">{t}</span>
                               </label>
                           ))}
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">Description</label>
                       <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all outline-none resize-none" placeholder="Describe the property..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                   </div>
               </div>
               
               <div className="flex items-center justify-between pt-8 border-t border-gray-50 gap-4">
                   <button type="button" onClick={handleCancelar} className="px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                   <div className="flex items-center gap-3">
                       <button type="button" onClick={() => setFormData({ ...formData, aprobado: !formData.aprobado })} className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${formData.aprobado ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                            {formData.aprobado ? <><IconX /> Unpublish</> : <><IconCheck /> Approve</>}
                       </button>
                       <button type="submit" disabled={subiendo} className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50">
                            {subiendo ? 'Saving...' : 'Save Changes'}
                       </button>
                   </div>
               </div>
            </form>
          </div>
        )}

        {/* --- VISTA 3: TABLA --- */}
        {vistaActual === 'tabla' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {comunidades.length === 0 ? (
                <div className="p-20 text-center">
                    <div className="inline-block p-4 rounded-full bg-gray-50 text-gray-300 mb-4"><IconList /></div>
                    <p className="text-gray-500 text-lg">No properties found.</p>
                </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Plan</th>
                        <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {comunidades.map((c) => (
                        <tr key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                                    <img src={c.imagen_url} alt="" className="object-cover w-full h-full" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-base">{c.nombre}</p>
                                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">📍 {c.ciudad}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${c.pagado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {c.pagado ? 'Premium' : 'Free'}
                            </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <button onClick={() => toggleAprobado(c.id, c.aprobado)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${c.aprobado ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 animate-pulse'}`}>
                                {c.aprobado ? 'Live' : 'Pending'}
                            </button>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditar(c)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm" title="Edit"><IconEdit /></button>
                                <button onClick={() => eliminarComunidad(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm" title="Delete"><IconTrash /></button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}