// Feature: editorial-content-system, Property 11
// Property 11: Homepage teaser shows 3 most recent published articles
// Validates: Requirements 7.1, 7.4

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { selectTeaserArticles } from './teaser-utils';
import type { Articulo } from '@/lib/types/articulo';

// Generate ISO date strings in a safe range
const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01 in ms
  .map((ms) => new Date(ms).toISOString());

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

const publishedArticuloArbitrary = articuloArbitrary.map((a) => ({
  ...a,
  status: 'published' as const,
  published_at: a.published_at ?? new Date(1609459200000).toISOString(),
}));

describe('Property 11: Homepage teaser shows 3 most recent published articles', () => {
  it('returns at most 3 articles for any input', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 0, maxLength: 50 }),
        (articles) => {
          const result = selectTeaserArticles(articles);
          expect(result.length).toBeLessThanOrEqual(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns only published articles', () => {
    fc.assert(
      fc.property(
        fc.array(articuloArbitrary, { minLength: 0, maxLength: 50 }),
        (articles) => {
          const result = selectTeaserArticles(articles);
          for (const a of result) {
            expect(a.status).toBe('published');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns articles ordered by published_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(publishedArticuloArbitrary, { minLength: 2, maxLength: 20 }),
        (articles) => {
          const result = selectTeaserArticles(articles);
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

  it('returns exactly the 3 most recent when more than 3 published articles exist', () => {
    fc.assert(
      fc.property(
        fc.array(publishedArticuloArbitrary, { minLength: 4, maxLength: 20 }),
        (articles) => {
          const result = selectTeaserArticles(articles);
          expect(result.length).toBe(3);

          // The 3 returned must be the top 3 by published_at desc
          const allSorted = [...articles].sort((a, b) => {
            const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
            const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
            return dateB - dateA;
          });
          const top3Ids = new Set(allSorted.slice(0, 3).map((a) => a.id));
          // When there are ties, the result ids must be a subset of the top-3 candidates
          // (ties can produce different valid orderings)
          const top3Dates = allSorted.slice(0, 3).map((a) =>
            a.published_at ? new Date(a.published_at).getTime() : 0
          );
          const minTopDate = Math.min(...top3Dates);

          for (const a of result) {
            const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
            expect(aDate).toBeGreaterThanOrEqual(minTopDate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array when zero published articles exist', () => {
    fc.assert(
      fc.property(
        fc.array(
          articuloArbitrary.map((a) => ({ ...a, status: 'draft' as const })),
          { minLength: 0, maxLength: 20 }
        ),
        (draftArticles) => {
          const result = selectTeaserArticles(draftArticles);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array for empty input (null render case)', () => {
    const result = selectTeaserArticles([]);
    expect(result).toHaveLength(0);
  });
});
