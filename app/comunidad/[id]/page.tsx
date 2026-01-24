// app/comunidad/[id]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BotonVolver from '@/components/BotonVolver'; 

interface Comunidad {
  id: string;
  nombre: string;
  imagen_url: string;
  ciudad: string;
  estado: string;
  precio_desde: number;
  tipo_mascota: string[];
  descripcion: string;
  telefono: string;
  email: string;
  destacada?: boolean;
}

// --- ICONOS SVG (Sin cambios, solo optimización de renderizado) ---
const PetIcons = {
  dog: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
      <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5" />
      <path d="M8 14v.5" />
      <path d="M16 14v.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
      <path d="M4.42 11.247A4.335 4.335 0 0 1 6.944 10c.324 0 .638.03.938.087 2.546.48 3.536 2.958 4.078 4.163.542-1.205 1.532-3.683 4.078-4.163.3-.057.614-.087.938-.087a4.331 4.331 0 0 1 2.525 1.247c.482.49.851 1.08 1.053 1.748.156.517.202 1.053.132 1.583a5.558 5.558 0 0 1-2.903 4.346c-1.398.814-2.98.983-4.526.484a2.988 2.988 0 0 0-1.257-.145 2.989 2.989 0 0 0-1.257.145c-1.545.499-3.128.33-4.526-.484a5.558 5.558 0 0 1-2.903-4.346 5.348 5.348 0 0 1 .132-1.583c.202-.667.571-1.257 1.053-1.747Z" />
    </svg>
  ),
  cat: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21S3 17.9 3 13.44C3 12.24 3.43 11.07 4 10c0 0-1.82-6.42-.42-7 1.39-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26Z" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
    </svg>
  ),
  bird: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  ),
  exotic: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 8a3 3 0 0 0-3 3v2a3 3 0 0 1-6 0v-2a3 3 0 0 0-6 0v2a9 9 0 0 0 18 0V11a3 3 0 0 0-3-3Z" />
    </svg>
  ),
  default: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M10 12h.01" /><path d="M14 12h.01" />
       <path d="M12 16c-1.1 0-2-.9-2-2v-1h4v1c0 1.1-.9 2-2 2z" />
       <path d="M5.1 8.3c1.4-2 3.6-3.3 6.9-3.3 3.3 0 5.5 1.3 6.9 3.3.4.6.4 1.5.1 2.1l-1.9 3.8c-.5 1-1.6 1.8-2.9 1.8H9.8c-1.3 0-2.4-.8-2.9-1.8L5 10.4c-.3-.6-.3-1.5.1-2.1z" />
    </svg>
  )
};

const getPetStyle = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes('dog') || t.includes('perro')) return { 
    Icon: PetIcons.dog, label: 'Dogs Welcome', 
    gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-100', text: 'text-blue-600', shadow: 'shadow-blue-100'
  };
  if (t.includes('cat') || t.includes('gato')) return { 
    Icon: PetIcons.cat, label: 'Cats Welcome', 
    gradient: 'from-orange-50 to-amber-50', border: 'border-orange-100', text: 'text-orange-600', shadow: 'shadow-orange-100'
  };
  if (t.includes('bird') || t.includes('ave')) return { 
    Icon: PetIcons.bird, label: 'Birds Allowed', 
    gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-600', shadow: 'shadow-emerald-100'
  };
  if (t.includes('exotic') || t.includes('exotico')) return { 
    Icon: PetIcons.exotic, label: 'Exotics OK', 
    gradient: 'from-purple-50 to-fuchsia-50', border: 'border-purple-100', text: 'text-purple-600', shadow: 'shadow-purple-100'
  };
  return { 
    Icon: PetIcons.default, label: 'Pet Friendly', 
    gradient: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-600', shadow: 'shadow-gray-100'
  };
};

export default async function DetalleComunidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Consultar datos a Supabase
  const { data: comunidad, error } = await supabase
    .from('comunidades')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !comunidad) {
    notFound();
  }

  // Limpiar teléfono
  const telefonoLimpio = comunidad.telefono ? comunidad.telefono.replace(/\D/g, '') : '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 font-sans">
      
      {/* Encabezado Hero (Altura adaptable) */}
      <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden group">
        <img 
          src={comunidad.imagen_url || '/placeholder-house.jpg'} 
          alt={comunidad.nombre} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Degradado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute top-6 left-6 z-10">
          <BotonVolver />
        </div>
        
        <div className="absolute bottom-12 md:bottom-16 left-0 right-0 px-6 md:px-8 w-full max-w-7xl mx-auto">
          {comunidad.destacada && (
            <div className="mb-3 md:mb-4 inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/90 backdrop-blur-md border border-amber-200 rounded-full shadow-sm">
                <span className="text-amber-500 text-xs md:text-sm">★</span>
                <span className="text-[8px] md:text-[10px] font-extrabold tracking-[0.2em] text-amber-800 uppercase">Featured Listing</span>
            </div>
          )}
          {/* Título adaptable */}
          <h1 className="text-3xl md:text-6xl font-extrabold mb-2 text-white tracking-tight leading-tight drop-shadow-md break-words">
            {comunidad.nombre}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-medium flex items-center gap-2">
            <span className="opacity-60 text-base">📍</span> {comunidad.ciudad}, {comunidad.estado}
          </p>
        </div>
      </div>

      {/* Tarjeta de Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-8 md:-mt-16 relative z-20">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-6 md:p-12">
          
          {/* SECCIÓN DE DATOS PRINCIPALES */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 md:mb-12 gap-8 border-b border-gray-50 pb-8 md:pb-12">
            
            {/* Precio */}
            <div>
              <p className="text-gray-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black mb-1 md:mb-2">Starting at</p>
              <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                ${comunidad.precio_desde?.toLocaleString()} <span className="text-base md:text-lg font-medium text-gray-400">/ mo</span>
              </p>
            </div>

            {/* --- ICONOS DE MASCOTAS RESPONSIVE --- */}
            <div className="w-full lg:w-auto">
              <p className="text-gray-800 text-[12px] text-center md:text-[12px] uppercase tracking-[0.1em] font-black mb-3 md:mb-4">Pets Welcome</p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                 {comunidad.tipo_mascota?.map((tipo: string) => {
                   const { Icon, label, gradient, border, text, shadow } = getPetStyle(tipo);
                   return (
                     <div key={tipo} className={`group relative flex flex-col items-center justify-center w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br ${gradient} border ${border} ${shadow} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                        {/* Icono más pequeño en móvil */}
                        <div className={`${text} mb-1 md:mb-2 transition-transform duration-300 group-hover:scale-110`}>
                           <Icon className="w-6 h-6 md:w-10 md:h-10" />
                        </div>
                        {/* Texto más pequeño en móvil */}
                        <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wide ${text} opacity-80`}>
                          {label.split(' ')[0]}
                        </span>
                        
                        {/* Badge 'OK' */}
                        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 ring-2 ring-white"></div>
                     </div>
                   );
                 })}
              </div>
            </div>

          </div>

          {/* Grid de Descripción y Contacto */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">
            
            {/* Descripción */}
            <div className="lg:col-span-2">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">About This Community</h3>
              <p className="text-gray-500 leading-relaxed text-base md:text-lg whitespace-pre-line font-medium text-justify">
                {comunidad.descripcion}
              </p>
            </div>

            {/* Sidebar de Contacto */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-[2rem] p-6 md:p-8 border border-gray-100 sticky top-24">
                <h3 className="text-[14px] md:text-[14px] text-center font-black text-gray-800 uppercase tracking-[0em] mb-6 md:mb-8">Contact Us</h3>
                
                <div className="space-y-3 md:space-y-4">
                  
                  {/* WhatsApp */}
                  {comunidad.telefono && (
                    <a 
                      href={`https://wa.me/${telefonoLimpio}?text=Hello, I saw your property "${comunidad.nombre}" on SeniorPetLiving and I'm interested in more information.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-5 md:py-4 md:px-6 rounded-xl md:rounded-2xl transition-all shadow-xl shadow-green-100 group"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        <span className="text-xs md:text-sm">WhatsApp Chat</span>
                    </a>
                  )}

                  {/* Email (Elegante Negro) */}
                  {comunidad.email && (
                    <a 
                      href={`mailto:${comunidad.email}?subject=Inquiry about ${comunidad.nombre}&body=Hello, I'm interested in receiving more information about the ${comunidad.nombre} community I saw on SeniorPetLiving.`}
                      className="flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-5 md:py-4 md:px-6 rounded-xl md:rounded-2xl transition-all shadow-xl shadow-gray-200 group"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-xs md:text-sm">Send Inquiry</span>
                    </a>
                  )}

                  {!comunidad.email && !comunidad.telefono && (
                    <div className="text-center text-gray-400 text-xs md:text-sm italic">
                       Contact information not available
                    </div>
                  )}

                </div>

                <p className="text-center text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-8 md:mt-10 leading-relaxed">
                    Exclusive listing on <br/><strong>SeniorPetLiving</strong>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}