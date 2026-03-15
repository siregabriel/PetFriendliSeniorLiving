// Feature: editorial-content-system, Property 9
// Property 9: Article detail page renders correct metadata
// Validates: Requirements 6.5, 6.6

// Feature: editorial-content-system, Property 10
// Property 10: Non-visible articles return 404
// Validates: Requirements 6.3, 6.4

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildArticleMetadata, shouldReturn404 } from './metadata-utils';
import type { Articulo } from '@/lib/types/articulo';

// ─── Shared arbitrary ────────────────────────────────────────────────────────

const isoDate = fc
  .integer({ min: 1577836800000, max: 1893456000000 })
  .map((ms) => new Date(ms).toISOString());

const publishedArticleArbitrary = fc.record<Articulo>({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.stringMatching(/^[a-z0-9-]{1,60}$/),
  body: fc.string({ minLength: 1, maxLength: 500 }),
  excerpt: fc.oneof(fc.string({ minLength: 1, maxLength: 200 }), fc.constant(null)),
  cover_image_url: fc.oneof(fc.webUrl(), fc.constant(null)),
  author_name: fc.oneof(fc.string({ minLength: 1, maxLength: 60 }), fc.constant(null)),
  category: fc.oneof(fc.string({ minLength: 1, maxLength: 40 }), fc.constant(null)),
  tags: fc.oneof(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), fc.constant(null)),
  city: fc.oneof(fc.string({ minLength: 1, maxLength: 40 }), fc.constant(null)),
  state: fc.oneof(fc.string({ minLength: 2, maxLength: 2 }), fc.constant(null)),
  meta_title: fc.oneof(fc.string({ minLength: 1, maxLength: 80 }), fc.constant(null)),
  meta_description: fc.oneof(fc.string({ minLength: 1, maxLength: 160 }), fc.constant(null)),
  status: fc.constant<'published'>('published'),
  published_at: fc.oneof(isoDate, fc.constant(null)),
  created_at: isoDate,
  updated_at: isoDate,
});

// ─── Property 9: Metadata fallback logic ─────────────────────────────────────

describe('Property 9: buildArticleMetadata — metadata fallback logic', () => {
  it('uses meta_title as title when present', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.filter((a) => a.meta_title !== null),
        (article) => {
          const metadata = buildArticleMetadata(article);
          expect(metadata.title).toBe(article.meta_title);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('falls back to title when meta_title is absent', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.map((a) => ({ ...a, meta_title: null })),
        (article) => {
          const metadata = buildArticleMetadata(article);
          expect(metadata.title).toBe(article.title);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('uses meta_description as description when present', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.filter((a) => a.meta_description !== null),
        (article) => {
          const metadata = buildArticleMetadata(article);
          expect(metadata.description).toBe(article.meta_description);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('falls back to excerpt when meta_description is absent', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary
          .map((a) => ({ ...a, meta_description: null }))
          .filter((a) => a.excerpt !== null),
        (article) => {
          const metadata = buildArticleMetadata(article);
          expect(metadata.description).toBe(article.excerpt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('OG title matches the resolved title (meta_title ?? title)', () => {
    fc.assert(
      fc.property(publishedArticleArbitrary, (article) => {
        const metadata = buildArticleMetadata(article);
        const expectedTitle = article.meta_title ?? article.title;
        const og = metadata.openGraph as { title?: string } | undefined;
        expect(og?.title).toBe(expectedTitle);
      }),
      { numRuns: 100 }
    );
  });

  it('OG description matches the resolved description (meta_description ?? excerpt)', () => {
    fc.assert(
      fc.property(publishedArticleArbitrary, (article) => {
        const metadata = buildArticleMetadata(article);
        const expectedDesc = article.meta_description ?? article.excerpt ?? '';
        const og = metadata.openGraph as { description?: string } | undefined;
        expect(og?.description).toBe(expectedDesc);
      }),
      { numRuns: 100 }
    );
  });

  it('OG image is set when cover_image_url is present', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.filter((a) => a.cover_image_url !== null),
        (article) => {
          const metadata = buildArticleMetadata(article);
          const og = metadata.openGraph as { images?: Array<{ url: string }> } | undefined;
          expect(og?.images).toBeDefined();
          expect((og?.images ?? []).length).toBeGreaterThan(0);
          expect((og?.images ?? [])[0].url).toBe(article.cover_image_url);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('OG image array is empty when cover_image_url is null', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.map((a) => ({ ...a, cover_image_url: null })),
        (article) => {
          const metadata = buildArticleMetadata(article);
          const og = metadata.openGraph as { images?: unknown[] } | undefined;
          expect(og?.images).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit test examples (specific cases)
  it('example: meta_title present → used as title', () => {
    const article: Articulo = {
      id: 1, title: 'Original Title', slug: 'original-title', body: 'body',
      excerpt: 'excerpt', cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null,
      meta_title: 'SEO Title Override', meta_description: null,
      status: 'published', published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    const metadata = buildArticleMetadata(article);
    expect(metadata.title).toBe('SEO Title Override');
  });

  it('example: meta_title absent → falls back to title', () => {
    const article: Articulo = {
      id: 2, title: 'Original Title', slug: 'original-title', body: 'body',
      excerpt: 'excerpt', cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null,
      meta_title: null, meta_description: null,
      status: 'published', published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    const metadata = buildArticleMetadata(article);
    expect(metadata.title).toBe('Original Title');
  });

  it('example: meta_description present → used as description', () => {
    const article: Articulo = {
      id: 3, title: 'Title', slug: 'title', body: 'body',
      excerpt: 'Short excerpt', cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null,
      meta_title: null, meta_description: 'Custom SEO description',
      status: 'published', published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    const metadata = buildArticleMetadata(article);
    expect(metadata.description).toBe('Custom SEO description');
  });

  it('example: meta_description absent → falls back to excerpt', () => {
    const article: Articulo = {
      id: 4, title: 'Title', slug: 'title', body: 'body',
      excerpt: 'Short excerpt', cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null,
      meta_title: null, meta_description: null,
      status: 'published', published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    const metadata = buildArticleMetadata(article);
    expect(metadata.description).toBe('Short excerpt');
  });

  it('example: OG tags populated correctly', () => {
    const article: Articulo = {
      id: 5, title: 'Title', slug: 'title', body: 'body',
      excerpt: 'Excerpt text', cover_image_url: 'https://example.com/img.jpg',
      author_name: null, category: null, tags: null, city: null, state: null,
      meta_title: 'OG Title', meta_description: 'OG Desc',
      status: 'published', published_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    const metadata = buildArticleMetadata(article);
    const og = metadata.openGraph as { title?: string; description?: string; images?: Array<{ url: string }> };
    expect(og.title).toBe('OG Title');
    expect(og.description).toBe('OG Desc');
    expect(og.images?.[0].url).toBe('https://example.com/img.jpg');
  });
});

// ─── Property 10: 404 behavior ───────────────────────────────────────────────

describe('Property 10: shouldReturn404 — 404 behavior', () => {
  it('returns true when article is null (slug not found)', () => {
    expect(shouldReturn404(null)).toBe(true);
  });

  it('returns true for draft articles', () => {
    fc.assert(
      fc.property(
        publishedArticleArbitrary.map((a) => ({ ...a, status: 'draft' as const })),
        (article) => {
          expect(shouldReturn404(article)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for published articles', () => {
    fc.assert(
      fc.property(publishedArticleArbitrary, (article) => {
        expect(shouldReturn404(article)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('example: draft article → shouldReturn404 is true', () => {
    const draft: Articulo = {
      id: 10, title: 'Draft Post', slug: 'draft-post', body: 'body',
      excerpt: null, cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null, meta_title: null, meta_description: null,
      status: 'draft', published_at: null,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    };
    expect(shouldReturn404(draft)).toBe(true);
  });

  it('example: non-existent slug (null) → shouldReturn404 is true', () => {
    expect(shouldReturn404(null)).toBe(true);
  });

  it('example: published article → shouldReturn404 is false', () => {
    const published: Articulo = {
      id: 11, title: 'Published Post', slug: 'published-post', body: 'body',
      excerpt: null, cover_image_url: null, author_name: null, category: null,
      tags: null, city: null, state: null, meta_title: null, meta_description: null,
      status: 'published', published_at: '2024-01-15T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-15T00:00:00Z',
    };
    expect(shouldReturn404(published)).toBe(false);
  });
});
