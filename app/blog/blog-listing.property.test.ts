// Feature: editorial-content-system, Property 8
// Property 8: Blog listing shows only published articles in order
// Validates: Requirements 5.2, 5.3, 5.5

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterAndSortArticles } from './blog-utils';
import type { Articulo } from '@/lib/types/articulo';

// Generate ISO date strings in a safe range (avoids RangeError during shrinking)
const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01 in ms
  .map((ms) => new Date(ms).toISOString());

// Arbitrary for a single Articulo
const articuloArbitrary = fc.record<Articulo>({
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
  status: fc.constantFrom<'draft' | 'published'>('draft', 'published'),
  published_at: fc.oneof(isoDateArbitrary, fc.constant(null)),
  created_at: isoDateArbitrary,
  updated_at: isoDateArbitrary,
});

describe('Property 8: Blog listing shows only published articles in order', () => {
  it('returns only published articles from a mixed array', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 0, maxLength: 30 }),
        (articles) => {
          const result = filterAndSortArticles(articles);

          // All returned articles must be published
          for (const a of result) {
            expect(a.status).toBe('published');
          }

          // Count of results must equal count of published in input
          const publishedCount = articles.filter((a) => a.status === 'published').length;
          expect(result.length).toBe(publishedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns articles ordered by published_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 2, maxLength: 30 }),
        (articles) => {
          const result = filterAndSortArticles(articles);

          // Verify descending order
          for (let i = 0; i < result.length - 1; i++) {
            const dateA = result[i].published_at ? new Date(result[i].published_at!).getTime() : 0;
            const dateB = result[i + 1].published_at ? new Date(result[i + 1].published_at!).getTime() : 0;
            expect(dateA).toBeGreaterThanOrEqual(dateB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each result has required fields present (title, slug, status, published_at)', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 0, maxLength: 20 }),
        (articles) => {
          const result = filterAndSortArticles(articles);

          for (const a of result) {
            expect(typeof a.title).toBe('string');
            expect(a.title.length).toBeGreaterThan(0);
            expect(typeof a.slug).toBe('string');
            expect(a.slug.length).toBeGreaterThan(0);
            expect(a.status).toBe('published');
            // author_name, excerpt, category, cover_image_url, city, state may be null — that's fine
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array when no articles are published', () => {
    fc.assert(
      fc.property(
        fc.array(
          articuloArbitrary.filter((a) => a.status === 'draft'),
          { minLength: 0, maxLength: 20 }
        ),
        (draftArticles) => {
          const result = filterAndSortArticles(draftArticles);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate the input array', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 0, maxLength: 20 }),
        (articles) => {
          const copy = [...articles];
          filterAndSortArticles(articles);
          expect(articles).toHaveLength(copy.length);
          for (let i = 0; i < articles.length; i++) {
            expect(articles[i].id).toBe(copy[i].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
