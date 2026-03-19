'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BotonVolver from '@/components/BotonVolver';
import Link from 'next/link';

interface PageContent {
  id: string;
  hero_image: string;
  title: string;
  subtitle: string;
  section1_title: string;
  section1_body: string;
  section2_title: string;
  section2_body: string;
  section3_title: string;
  section3_bullets: string[];
}

const DEFAULTS: Record<string, PageContent> = {
  'independent-living': {
    id: 'independent-living', hero_image: 'https://images.pexels.com/photos/6131006/pexels-photo-6131006.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Independent Living', subtitle: 'Pet-Friendly Options',
    section1_title: 'What is Independent Living?', section1_body: 'Independent living communities are designed for active seniors who can live on their own but want the convenience of community amenities, social activities, and maintenance-free living.',
    section2_title: 'Pets in Independent Living', section2_body: 'Many independent living communities warmly welcome pets. Dogs, cats, and small animals are commonly allowed.',
    section3_title: 'What to Look For', section3_bullets: ['Pet-friendly outdoor spaces','On-site veterinary services','Pet care assistance','Community pet events','Clear pet policies'],
  },
  'assisted-living': {
    id: 'assisted-living', hero_image: 'https://images.pexels.com/photos/7203956/pexels-photo-7203956.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Assisted Living', subtitle: 'Pet-Friendly Options',
    section1_title: 'What is Assisted Living?', section1_body: 'Assisted living communities provide personalized support for seniors who need help with daily activities while maintaining independence.',
    section2_title: 'Pets in Assisted Living', section2_body: 'Pets play a vital therapeutic role. Animal companionship reduces anxiety, lowers blood pressure, and improves overall mood.',
    section3_title: 'What to Look For', section3_bullets: ['Pet care assistance available','Safe outdoor areas','Staff trained in pet therapy','Flexible pet policies','Nearby veterinary services'],
  },
  'memory-care': {
    id: 'memory-care', hero_image: 'https://images.pexels.com/photos/6816861/pexels-photo-6816861.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Memory Care', subtitle: 'Pet-Friendly Options',
    section1_title: 'What is Memory Care?', section1_body: 'Memory care communities are specialized settings for individuals living with Alzheimer\'s, dementia, or other forms of memory loss.',
    section2_title: 'Pets in Memory Care', section2_body: 'Animal-assisted therapy has shown remarkable benefits. Interacting with pets can trigger positive memories and reduce agitation.',
    section3_title: 'What to Look For', section3_bullets: ['Animal-assisted therapy programs','Therapy pets on-site','Staff support for pet care','Secure outdoor spaces','Compassionate pet transition planning'],
  },
};

export default function SeniorLivingPage({ pageId }: { pageId: string }) {
  const [content, setContent] = useState<PageContent>(DEFAULTS[pageId]);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PageContent>(DEFAULTS[pageId]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch content from Supabase
    supabase.from('senior_living_pages').select('*').eq('id', pageId).single()
      .then(({ data }) => { if (data) { setContent(data); setDraft(data); } });

    // Check role
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
      if (perfil && ['admin', 'moderator', 'super_admin'].includes(perfil.rol)) setCanEdit(true);
    });
  }, [pageId]);

  const save = async () => {
    setSaving(true);
    await supabase.from('senior_living_pages').upsert({ ...draft, updated_at: new Date().toISOString() });
    setContent(draft);
    setEditing(false);
    setSaving(false);
  };

  const Field = ({ label, value, field, multiline = false }: { label: string; value: string; field: keyof PageContent; multiline?: boolean }) =>
    editing ? (
      <div className="mb-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
        {multiline
          ? <textarea rows={4} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200 resize-none" value={draft[field] as string} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} />
          : <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200" value={draft[field] as string} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} />
        }
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="w-full h-64 relative overflow-hidden">
        <img src={content.hero_image} alt={content.title} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-5 left-5"><BotonVolver /></div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-2 rounded-full shadow transition-all">
            ✏️ Edit page
          </button>
        )}
        <div className="absolute bottom-6 left-6">
          <h1 className="text-3xl font-bold text-white">{content.title}</h1>
          <p className="text-white/80 text-sm mt-1">{content.subtitle}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Edit panel */}
        {editing && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4">Editing page content</p>
            <Field label="Hero Image URL" field="hero_image" value={draft.hero_image} />
            <Field label="Title" field="title" value={draft.title} />
            <Field label="Subtitle" field="subtitle" value={draft.subtitle} />
            <Field label="Section 1 Title" field="section1_title" value={draft.section1_title} />
            <Field label="Section 1 Body" field="section1_body" value={draft.section1_body} multiline />
            <Field label="Section 2 Title" field="section2_title" value={draft.section2_title} />
            <Field label="Section 2 Body" field="section2_body" value={draft.section2_body} multiline />
            <Field label="Section 3 Title" field="section3_title" value={draft.section3_title} />
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Bullet Points (one per line)</label>
              <textarea rows={5} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                value={draft.section3_bullets.join('\n')}
                onChange={e => setDraft(d => ({ ...d, section3_bullets: e.target.value.split('\n') }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold px-5 py-2 rounded-full text-sm shadow disabled:opacity-50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => { setEditing(false); setDraft(content); }} className="bg-white border border-gray-200 text-gray-600 font-semibold px-5 py-2 rounded-full text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{content.section1_title}</h2>
          <p className="text-gray-500 leading-relaxed text-[15px]">{content.section1_body}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{content.section2_title}</h2>
          <p className="text-gray-500 leading-relaxed text-[15px]">{content.section2_body}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{content.section3_title}</h2>
          <ul className="space-y-2 text-gray-500 text-[15px]">
            {content.section3_bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">🐾</span>{item}</li>
            ))}
          </ul>
        </div>

        <Link href="/?mascota=todos" className="block w-full text-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all">
          Browse {content.title} Communities
        </Link>
      </div>
    </div>
  );
}
