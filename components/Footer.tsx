// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐾</span>
            <span className="font-bold text-gray-900 text-lg">Senior Pet Living</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Helping seniors and their pets find the perfect home to live together and be happy.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/" className="text-gray-500 hover:text-rose-500 transition-colors">
                Find a Home
              </a>
            </li>
            <li>
              <a href="/publicar" className="text-gray-500 hover:text-rose-500 transition-colors">
                Post a Property
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-500 hover:text-rose-500 transition-colors">
                About Us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact</h4>
          <p className="text-sm text-gray-500">contact@seniorpetliving.com</p>
        </div>

      </div>
      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} SeniorPetLiving. All rights reserved.
      </div>
    </footer>
  );
}
