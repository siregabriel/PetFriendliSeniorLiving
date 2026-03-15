// Feature: editorial-content-system
import { MetadataRoute } from 'next';

export interface ArticleSitemapInput {
  slug: string;
  updated_at: string;
}

/**
 * Maps an array of published articles to sitemap entries.
 * Pure function — no Supabase calls. Caller is responsible for filtering to published only.
 */
export function buildArticleSitemapEntries(
  articles: ArticleSitemapInput[],
  baseUrl: string
): MetadataRoute.Sitemap {
  return articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: article.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
