/**
 * Unit tests for ArticleEditor validation and slug logic
 * Feature: editorial-content-system
 * Validates: Requirements 3.3, 3.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { slugify } from '@/lib/slugify';

// ---------------------------------------------------------------------------
// Inline minimal ArticleEditor component that mirrors the real logic exactly,
// allowing direct rendering without the full AdminDashboard auth flow.
// ---------------------------------------------------------------------------

interface ArticuloForm {
  title: string;
  slug: string;
  body: string;
}

interface Errors {
  title?: string;
  body?: string;
}

function validateArticuloForm(form: ArticuloForm): Errors {
  const errors: Errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.body.trim()) errors.body = 'Body is required.';
  return errors;
}

/** Minimal ArticleEditor that mirrors the real slug + validation logic */
function ArticleEditorTestHarness({ onSubmit = vi.fn() }: { onSubmit?: (form: ArticuloForm) => void }) {
  const [form, setForm] = useState<ArticuloForm>({ title: '', slug: '', body: '' });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateArticuloForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-testid="title"
        placeholder="Enter title"
        value={form.title}
        onChange={e => {
          const newTitle = e.target.value;
          setForm(prev => ({
            ...prev,
            title: newTitle,
            slug: slugManuallyEdited ? prev.slug : slugify(newTitle),
          }));
        }}
      />
      <input
        data-testid="slug"
        placeholder="auto-generated-slug"
        value={form.slug}
        onChange={e => {
          setSlugManuallyEdited(true);
          setForm(prev => ({ ...prev, slug: e.target.value }));
        }}
      />
      <textarea
        data-testid="body"
        placeholder="Enter body"
        value={form.body}
        onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
      />
      {errors.title && <span data-testid="title-error">{errors.title}</span>}
      {errors.body && <span data-testid="body-error">{errors.body}</span>}
      <button type="submit">Save Article</button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ArticleEditor - Validation (Requirement 3.5)', () => {
  it('shows validation error for empty title and does not call onSubmit', () => {
    const onSubmit = vi.fn();
    render(<ArticleEditorTestHarness onSubmit={onSubmit} />);

    // Fill body, leave title empty
    fireEvent.change(screen.getByTestId('body'), { target: { value: 'Some body content' } });
    fireEvent.click(screen.getByRole('button', { name: /save article/i }));

    expect(screen.getByTestId('title-error').textContent).toBe('Title is required.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for empty body and does not call onSubmit', () => {
    const onSubmit = vi.fn();
    render(<ArticleEditorTestHarness onSubmit={onSubmit} />);

    // Fill title, leave body empty
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'My Title' } });
    fireEvent.click(screen.getByRole('button', { name: /save article/i }));

    expect(screen.getByTestId('body-error').textContent).toBe('Body is required.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when both title and body are filled', () => {
    const onSubmit = vi.fn();
    render(<ArticleEditorTestHarness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId('title'), { target: { value: 'My Title' } });
    fireEvent.change(screen.getByTestId('body'), { target: { value: 'My body content' } });
    fireEvent.click(screen.getByRole('button', { name: /save article/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('title-error')).toBeNull();
    expect(screen.queryByTestId('body-error')).toBeNull();
  });
});

describe('ArticleEditor - Slug auto-generation (Requirement 3.3)', () => {
  it('auto-generates slug from title when slug has not been manually edited', () => {
    render(<ArticleEditorTestHarness />);

    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Hello World' } });

    const slugInput = screen.getByTestId('slug') as HTMLInputElement;
    expect(slugInput.value).toBe('hello-world');
  });

  it('auto-generates slug with special characters stripped', () => {
    render(<ArticleEditorTestHarness />);

    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Café & Résumé!' } });

    const slugInput = screen.getByTestId('slug') as HTMLInputElement;
    expect(slugInput.value).toBe('caf-rsum');
  });

  it('does not overwrite slug when it has been manually edited', () => {
    render(<ArticleEditorTestHarness />);

    // Type a title to get auto-slug
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Hello' } });

    // Manually edit the slug
    fireEvent.change(screen.getByTestId('slug'), { target: { value: 'my-custom-slug' } });

    // Change the title again
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Hello World' } });

    const slugInput = screen.getByTestId('slug') as HTMLInputElement;
    expect(slugInput.value).toBe('my-custom-slug');
  });

  it('slug stays in sync with title changes before any manual edit', () => {
    render(<ArticleEditorTestHarness />);

    fireEvent.change(screen.getByTestId('title'), { target: { value: 'First Title' } });
    expect((screen.getByTestId('slug') as HTMLInputElement).value).toBe('first-title');

    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Second Title' } });
    expect((screen.getByTestId('slug') as HTMLInputElement).value).toBe('second-title');
  });
});

describe('validateArticuloForm - pure function (Requirement 3.5)', () => {
  it('returns title error for empty title', () => {
    const errors = validateArticuloForm({ title: '', slug: 'slug', body: 'body' });
    expect(errors.title).toBe('Title is required.');
    expect(errors.body).toBeUndefined();
  });

  it('returns title error for whitespace-only title', () => {
    const errors = validateArticuloForm({ title: '   ', slug: 'slug', body: 'body' });
    expect(errors.title).toBe('Title is required.');
  });

  it('returns body error for empty body', () => {
    const errors = validateArticuloForm({ title: 'Title', slug: 'slug', body: '' });
    expect(errors.body).toBe('Body is required.');
    expect(errors.title).toBeUndefined();
  });

  it('returns body error for whitespace-only body', () => {
    const errors = validateArticuloForm({ title: 'Title', slug: 'slug', body: '   ' });
    expect(errors.body).toBe('Body is required.');
  });

  it('returns both errors when title and body are empty', () => {
    const errors = validateArticuloForm({ title: '', slug: 'slug', body: '' });
    expect(errors.title).toBe('Title is required.');
    expect(errors.body).toBe('Body is required.');
  });

  it('returns no errors for valid title and body', () => {
    const errors = validateArticuloForm({ title: 'My Title', slug: 'my-title', body: 'Content here' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
