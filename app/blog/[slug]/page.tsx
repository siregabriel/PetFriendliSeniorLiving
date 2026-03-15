// app/blog/[slug]/page.tsx — Server Component (no 'use client')
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Articulo } from '@/lib/types/articulo';
import ShareButtons from '@/components/ShareButtons';
import { shouldReturn404, buildArticleMetadata } from './metadata-utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from('articulos')
    .select('*')
    .eq('slug', slug)
    .single();

  const article = data as Articulo | null;
  if (shouldReturn404(article)) {
    return { title: 'Not Found' };
  }

  return buildArticleMetadata(article!);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .eq('slug', slug)
    .single();

  const article = (error ? null : data) as Articulo | null;

  if (shouldReturn404(article)) {
    notFound();
  }

  // article is guaranteed non-null and published here
  const a = article!;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Cover image */}
        <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-2xl overflow-hidden mb-8 flex items-center justify-center">
          {a.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.cover_image_url}
              alt={a.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl">🐾</span>
          )}
        </div>

        {/* Category + geo */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wide">
          {a.category && (
            <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {a.category}
            </span>
          )}
          {a.city && a.state && (
            <span className="bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full">
              {a.city}, {a.state}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {a.title}
        </h1>

        {/* Meta row: author + date */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          {a.author_name && (
            <span className="font-medium text-gray-600">{a.author_name}</span>
          )}
          {a.author_name && a.published_at && (
            <span className="text-gray-300">·</span>
          )}
          {a.published_at && (
            <span>{formatDate(a.published_at)}</span>
          )}
        </div>

        {/* Body content */}
        <div className="prose prose-gray max-w-none mb-10">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
            {a.body}
          </p>
        </div>

        {/* Tags */}
        {a.tags && a.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-200">
            {a.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share buttons */}
        <ShareButtons title={a.title} />
      </div>
    </main>
  );
}
