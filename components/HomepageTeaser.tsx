// components/HomepageTeaser.tsx — Server Component (no 'use client')
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Articulo } from '@/lib/types/articulo';
import { selectTeaserArticles } from './teaser-utils';

export default async function HomepageTeaser() {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  const articles: Articulo[] = error ? [] : selectTeaserArticles(data ?? []);

  if (articles.length === 0) return null;

  return (
    <section className="w-full bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Latest Articles
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all articles →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Cover image */}
              <div className="w-full h-44 bg-gray-100 overflow-hidden flex items-center justify-center">
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
                {article.category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                    {article.category}
                  </span>
                )}

                <h3 className="text-gray-900 font-bold text-base leading-snug group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
