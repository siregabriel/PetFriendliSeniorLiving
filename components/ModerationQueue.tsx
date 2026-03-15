'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface PendingRating {
  id: string;
  stars: number;
  review: string | null;
  status: string;
  created_at: string;
  user_id: string;
  comunidad_id: string;
  comunidades?: { nombre: string } | null;
}

export default function ModerationQueue() {
  const [ratings, setRatings] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Use service role via API or fetch directly — here we use the anon client
      // Moderators see pending via the service role key in the API; for display we
      // call a dedicated fetch using the session token so the API can authorize.
      const res = await fetch('/api/ratings/pending', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRatings(data.ratings ?? []);
      }
      setLoading(false);
    };

    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/ratings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Optimistically remove from list
        setRatings((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-400 py-8 text-center">Loading pending ratings…</div>;
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-gray-500 font-medium">No pending ratings</p>
        <p className="text-gray-400 text-sm mt-1">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((r) => (
        <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-lg">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {r.comunidades?.nombre ?? r.comunidad_id}
              </span>
            </div>
            {r.review && (
              <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-3">{r.review}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>User: {r.user_id.slice(0, 8)}…</span>
              <span>·</span>
              <span>{new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleAction(r.id, 'approve')}
              disabled={processing === r.id}
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(r.id, 'reject')}
              disabled={processing === r.id}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
