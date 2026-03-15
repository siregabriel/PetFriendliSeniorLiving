// Feature: editorial-content-system
import type { Metadata } from 'next';
import type { Articulo } from '@/lib/types/articulo';

/**
 * Returns true when the article should result in a 404 response:
 * - article is null (slug not found)
 * - article has status 'draft'
 *
 * Property 10: Non-visible articles return 404
 * Validates: Requirements 6.3, 6.4
 */
export function shouldReturn404(article: Articulo | null): boolean {
  if (article === null) return true;
  if (article.status === 'draft') return true;
  return false;
}

/**
 * Builds Next.js Metadata for an article detail page.
 * - title: meta_title ?? title
 * - description: meta_description ?? excerpt
 * - Open Graph: og:title, og:description, og:image
 * - city/state included in alternates.canonical keywords when present
 *
 * Property 9: Article detail page renders correct metadata
 * Validates: Requirements 6.5, 6.6, 6.7
 */
export function buildArticleMetadata(article: Articulo): Metadata {
  const title = article.meta_title ?? article.title;
  const description = article.meta_description ?? article.excerpt ?? undefined;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description: description ?? '',
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : [],
    },
  };

  // Include city/state in keywords for geo-targeted SEO (Requirement 6.7)
  if (article.city && article.state) {
    metadata.keywords = [`${article.city}`, `${article.state}`, `${article.city}, ${article.state}`];
  }

  return metadata;
}
