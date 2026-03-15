// Feature: editorial-content-system
import { Articulo } from '@/lib/types/articulo';

/**
 * Filters articles to only published ones and sorts by published_at descending.
 * Extracted as a pure function so it can be tested independently of the Next.js page.
 */
export function filterAndSortArticles(articles: Articulo[]): Articulo[] {
  return articles
    .filter((a) => a.status === 'published')
    .sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });
}
