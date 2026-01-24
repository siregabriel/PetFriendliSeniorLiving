// components/Mapa.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; // Agregamos useMap
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react'; // Agregamos hooks

// Configuración de icono (Leaflet en Next.js a veces pierde los iconos por defecto)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// --- NUEVO: Icono para la ubicación del usuario (Punto Azul) ---
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div style="background-color: #3B82F6; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Lugar {
  id: number;
  nombre: string;
  latitud?: number;
  longitud?: number;
  ciudad: string;
}

interface MapaProps {
  lugares: Lugar[];
  // 👇 Nueva función que recibimos desde el padre
  onFiltrarCiudad?: (ciudad: string) => void; 
}

// --- NUEVO: Componente lógico para manejar el "Vuelo" a la ubicación ---
function UserLocation({ active }: { active: boolean }) {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (active) {
      map.locate().on("locationfound", function (e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, 13); // Zoom suave hacia el usuario
      });
    }
  }, [active, map]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here 📍</Popup>
    </Marker>
  );
}

export default function Mapa({ lugares, onFiltrarCiudad }: MapaProps) {
  // Estado para activar la geolocalización
  const [locateUser, setLocateUser] = useState(false);

  // Centro por defecto (CDMX aprox) o el primer lugar
  const centro: [number, number] = lugares.length > 0 && lugares[0].latitud && lugares[0].longitud
    ? [lugares[0].latitud, lugares[0].longitud] 
    : [19.4326, -99.1332];

  return (
    <div className="relative w-full h-[400px]">
      
      {/* --- NUEVO: Botón Flotante --- */}
      <button
        onClick={() => setLocateUser(true)}
        className="absolute top-4 right-4 z-[999] bg-white text-gray-800 px-4 py-2 rounded-full shadow-md font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all flex items-center gap-2"
      >
        📍 Find Near Me
      </button>

      <MapContainer center={centro} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
        {/* Usamos un mapa base más limpio y moderno (Voyager) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Inyectamos el componente de usuario */}
        <UserLocation active={locateUser} />
        
        {lugares.map((lugar) => (
          lugar.latitud && lugar.longitud && (
            <Marker 
              key={lugar.id} 
              position={[lugar.latitud, lugar.longitud]} 
              icon={icon}
              eventHandlers={{
                // 👇 AQUÍ ESTÁ LA MAGIA: Al hacer click, filtramos
                click: () => {
                  if (onFiltrarCiudad) {
                    onFiltrarCiudad(lugar.ciudad);
                  }
                },
              }}
            >
              <Popup>
                <strong>{lugar.nombre}</strong> <br />
                {lugar.ciudad} <br/>
                <span className="text-xs text-blue-600">Click on the pin to see properties in this city</span>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}