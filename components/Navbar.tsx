// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* LOGO (Clic para ir al inicio) */}
        <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          🐶 <span className="hidden md:inline">Senior Pet Living Near Me</span>
        </Link>

        {/* ENLACES */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium text-sm">
            Explore
          </Link>
          
          <Link 
            href="/publicar" 
            className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition text-sm shadow-sm flex items-center gap-2"
          >
            <span>+</span> Publish a Community
          </Link>
        </div>

      </div>
    </nav>
  );
}