'use client';

import { useRouter } from 'next/navigation';

export default function BotonVolver() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/40 text-black text-sm font-medium hover:bg-white/30 transition-all shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Back
    </button>
  );
}
