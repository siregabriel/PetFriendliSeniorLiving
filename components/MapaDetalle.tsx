// components/MapaDetalle.tsx
'use client'; // 👈 Esto le dice a Next.js: "Este trocito es para el navegador"

import dynamic from 'next/dynamic';

// Aquí sí podemos usar ssr: false sin que explote
const Mapa = dynamic(() => import('./Mapa'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-[2rem] flex items-center justify-center text-gray-400 font-medium">Loading Map...</div>
});

export default function MapaDetalle({ lugares }: { lugares: any[] }) {
  return <Mapa lugares={lugares} />;
}