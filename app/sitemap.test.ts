// Feature: editorial-content-system, Property 12
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildArticleSitemapEntries, ArticleSitemapInput } from './sitemap-utils';

const BASE_URL = 'https://seniorpetliving.com';

// Arbitrary for a valid article sitemap input
const articleArb = fc.record<ArticleSitemapInput>({
  slug: fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/).filter((s) => s.length > 0),
  updated_at: fc
    .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
    .map((ms) => new Date(ms).toISOString()),
});

describe('buildArticleSitemapEntries', () => {
  // Validates: Requirements 8.1, 8.2, 8.3

  it('produces correct /blog/[slug] URL format for a published article', () => {
    const articles: ArticleSitemapInput[] = [
      { slug: 'pet-friendly-senior-living-austin', updated_at: '2024-06-01T00:00:00Z' },
    ];
    const entries = buildArticleSitemapEntries(articles, BASE_URL);
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(`${BASE_URL}/blog/pet-friendly-senior-living-austin`);
  });

  it('sets lastModified equal to the article updated_at', () => {
    const updatedAt = '2024-03-15T12:00:00Z';
    const articles: ArticleSitemapInput[] = [{ slug: 'some-article', updated_at: updatedAt }];
    const entries = buildArticleSitemapEntries(articles, BASE_URL);
    expect(entries[0].lastModified).toBe(updatedAt);
  });

  it('returns an empty array when given no articles (caller filtered out drafts)', () => {
    const entries = buildArticleSitemapEntries([], BASE_URL);
    expect(entries).toHaveLength(0);
  });

  it('sets changeFrequency to weekly and priority to 0.7', () => {
    const articles: ArticleSitemapInput[] = [{ slug: 'test-slug', updated_at: '2024-01-01T00:00:00Z' }];
    const entries = buildArticleSitemapEntries(articles, BASE_URL);
    expect(entries[0].changeFrequency).toBe('weekly');
    expect(entries[0].priority).toBe(0.7);
  });

  it('produces one entry per article', () => {
    const articles: ArticleSitemapInput[] = [
      { slug: 'article-one', updated_at: '2024-01-01T00:00:00Z' },
      { slug: 'article-two', updated_at: '2024-02-01T00:00:00Z' },
      { slug: 'article-three', updated_at: '2024-03-01T00:00:00Z' },
    ];
    const entries = buildArticleSitemapEntries(articles, BASE_URL);
    expect(entries).toHaveLength(3);
  });

  // Property: all entries have correct URL format and lastModified
  it('property: all entries have correct URL format and lastModified for arbitrary article arrays', () => {
    // Validates: Requirements 8.1, 8.2, 8.3
    fc.assert(
      fc.property(fc.array(articleArb, { minLength: 0, maxLength: 50 }), (articles) => {
        const entries = buildArticleSitemapEntries(articles, BASE_URL);

        expect(entries).toHaveLength(articles.length);

        entries.forEach((entry, i) => {
          // URL must be /blog/[slug]
          expect(entry.url).toBe(`${BASE_URL}/blog/${articles[i].slug}`);
          // lastModified must equal updated_at
          expect(entry.lastModified).toBe(articles[i].updated_at);
          // Fixed fields
          expect(entry.changeFrequency).toBe('weekly');
          expect(entry.priority).toBe(0.7);
        });
      })
    );
  });
});
