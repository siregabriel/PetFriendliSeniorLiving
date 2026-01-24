// components/BotonVolver.tsx
'use client'; // <--- OBLIGATORIO

import { useRouter } from 'next/navigation';

export default function BotonVolver() {
  const router = useRouter();

  const handleVolver = () => {
    console.log("Intentando volver atrás..."); // Esto aparecerá en la consola del navegador (F12)
    router.back();
  };

  return (
    <button 
      onClick={handleVolver} 
      className="text-sm hover:underline mb-4 inline-block opacity-90 hover:opacity-100 cursor-pointer text-white bg-transparent border-none p-0 text-left"
    >
      ← Back to map
    </button>
  );
}