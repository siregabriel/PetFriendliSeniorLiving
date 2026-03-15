// app/blog/page.tsx — Server Component (no 'use client')
import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Articulo } from '@/lib/types/articulo';
import { filterAndSortArticles } from './blog-utils';

export const metadata: Metadata = {
  title: 'Blog | Senior Pet Living',
  description:
    'Guides, tips, and city-specific resources for seniors looking for pet-friendly retirement communities.',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogListingPage() {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const articles: Articulo[] = error ? [] : filterAndSortArticles(data ?? []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Senior Pet Living Blog
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Guides, tips, and city-specific resources for seniors and their beloved pets.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-gray-400 text-base mt-20">
            No articles published yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {article.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-4xl">🐾</span>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-5 gap-2">
                  {/* Category + geo tag */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {article.category && (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {article.category}
                      </span>
                    )}
                    {article.city && article.state && (
                      <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                        {article.city}, {article.state}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-gray-900 font-bold text-base leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    {article.author_name && (
                      <span className="font-medium text-gray-500">{article.author_name}</span>
                    )}
                    {article.published_at && (
                      <span>{formatDate(article.published_at)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
