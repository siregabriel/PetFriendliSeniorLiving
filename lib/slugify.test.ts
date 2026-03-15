import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('converts uppercase to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('handles multiple consecutive spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('leaves already-valid slug unchanged', () => {
    expect(slugify('pet-friendly-senior-living')).toBe('pet-friendly-senior-living');
  });

  it('strips accents and special unicode characters', () => {
    expect(slugify('café au lait')).toBe('caf-au-lait');
  });

  it('handles numbers', () => {
    expect(slugify('Top 10 Tips')).toBe('top-10-tips');
  });

  it('trims leading and trailing spaces', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('handles string with only special characters', () => {
    const result = slugify('!@#$%');
    expect(result).toBe('');
  });
});
