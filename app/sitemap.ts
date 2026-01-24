// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://seniorpetliving.com'; // ⚠️ CAMBIA ESTO POR TU DOMINIO REAL (o localhost por ahora)

  // 1. Obtener todas las comunidades aprobadas
  const { data: comunidades } = await supabase
    .from('comunidades')
    .select('id, created_at') // Asumiendo que tienes created_at, si no, quítalo
    .eq('aprobado', true);

  // 2. Generar URLs dinámicas
  const communityUrls = (comunidades || []).map((c) => ({
    url: `${baseUrl}/comunidad/${c.id}`,
    lastModified: new Date(), // O c.created_at
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Retornar lista completa
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/publicar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...communityUrls,
  ];
}