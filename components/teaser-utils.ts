// Feature: editorial-content-system
import { Articulo } from '@/lib/types/articulo';

/**
 * Pure function: filters to published articles, sorts by published_at desc, returns at most 3.
 * Returns empty array if none qualify.
 */
export function selectTeaserArticles(articles: Articulo[]): Articulo[] {
  return articles
    .filter((a) => a.status === 'published')
    .sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);
}
