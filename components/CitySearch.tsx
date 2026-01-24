// components/CitySearch.tsx
'use client';

import { useState, useEffect } from 'react';

interface Suggestion {
  name: string;
  state: string;
  full: string;
}

export default function CitySearch({ onSelect, defaultValue = "" }: { onSelect: (city: string, state: string) => void, defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        // Usamos Mapbox Geocoding para buscar lugares
        const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place&country=us`
        );
        const data = await res.json();
        
        const results = data.features.map((f: any) => ({
          name: f.text,
          state: f.context?.find((c: any) => c.id.startsWith('region'))?.text || "",
          full: f.place_name
        }));
        setSuggestions(results);
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Start typing city name..."
        className="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none text-sm transition-all"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
              onClick={() => {
                setQuery(s.name);
                setIsOpen(false);
                onSelect(s.name, s.state);
              }}
            >
              <span className="font-bold text-gray-800">{s.name}</span>
              <span className="text-xs text-gray-400">{s.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}