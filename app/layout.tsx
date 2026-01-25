/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 25, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. IMPORTAR LOS COMPONENTES
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // El %s se reemplaza automáticamente por el título de la página interna
  title: {
    template: "%s | Senior Pet Living", 
    default: "Senior Pet Living - Find Pet Friendly Retirement Communities",
  },
  metadataBase: new URL('https://senior-pet-living.vercel.app'),
  description: "Explore the best pet-friendly senior living communities. Dogs, cats, and exotic pets welcome.",
  openGraph: {
    title: "Senior Pet Living Near You",
    description: "Don't leave your best friend behind. Find a home for both of you.",
    url: "https://seniorpetliving.com", // Pon tu dominio real aquí cuando lo tengas
    siteName: "Senior Pet Living",
    images: [
      {
        url: "/og-image-default.jpg", // Debes poner una imagen genérica en tu carpeta public/
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        
        {/* 2. AGREGAR NAVBAR ARRIBA */}
        <Navbar />

        {/* El contenido de cada página se renderiza aquí */}
        <div className="min-h-screen flex flex-col">
           {children}
        </div>

        {/* 3. AGREGAR FOOTER ABAJO */}
        <Footer />
        
      </body>
    </html>
  );
}