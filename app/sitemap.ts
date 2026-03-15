// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { buildArticleSitemapEntries } from './sitemap-utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://seniorpetliving.com';

  // 1. Fetch approved communities
  const { data: comunidades } = await supabase
    .from('comunidades')
    .select('id, created_at')
    .eq('aprobado', true);

  const communityUrls = (comunidades || []).map((c) => ({
    url: `${baseUrl}/comunidad/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 2. Fetch published articles
  const { data: articulos } = await supabase
    .from('articulos')
    .select('slug, updated_at')
    .eq('status', 'published');

  const articleUrls = buildArticleSitemapEntries(articulos || [], baseUrl);

  // 3. Return full sitemap
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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...communityUrls,
    ...articleUrls,
  ];
}
