// Feature: editorial-content-system, Property 4
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { slugify } from './slugify';

/**
 * Validates: Requirements 3.3
 *
 * Property 4: Slug generation from title
 * For any non-empty title string, the slugify function SHALL produce a slug
 * that is lowercase, contains only alphanumeric characters and hyphens,
 * and has no leading or trailing hyphens.
 */
describe('slugify - Property 4: Slug generation from title', () => {
  it('output is always lowercase', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (title) => {
        const result = slugify(title);
        return result === result.toLowerCase();
      }),
      { numRuns: 100 }
    );
  });

  it('output contains only [a-z0-9-] characters', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (title) => {
        const result = slugify(title);
        return /^[a-z0-9-]*$/.test(result);
      }),
      { numRuns: 100 }
    );
  });

  it('output has no leading or trailing hyphens', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (title) => {
        const result = slugify(title);
        if (result.length === 0) return true;
        return !result.startsWith('-') && !result.endsWith('-');
      }),
      { numRuns: 100 }
    );
  });
});
