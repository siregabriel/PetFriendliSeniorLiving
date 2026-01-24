// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Senior Pet Living Near Me</h3>
          <p className="text-sm leading-relaxed opacity-80">
            Help seniors and their pets find the perfect home to live together and be happy.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-white transition">Find a Home</a></li>
            <li><a href="/publicar" className="hover:text-white transition">Post a Property</a></li>
            <li><a href="#" className="hover:text-white transition">About Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Contact Us</h4>
          <p className="text-sm opacity-80">contact@seniorpetliving.com</p>
        </div>

      </div>
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs opacity-50">
        &copy; {new Date().getFullYear()} SeniorPetLiving. Todos los derechos reservados.
      </div>
    </footer>
  );
}