'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ProfileData {
  nombre: string; bio: string; telefono: string;
  ciudad: string; estado: string; sitio_web: string; avatar_url: string;
}

const EMPTY_PROFILE: ProfileData = { nombre: '', bio: '', telefono: '', ciudad: '', estado: '', sitio_web: '', avatar_url: '' };

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

export default function EditarPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/login'); return; }
      const user = session.user;
      setUserId(user.id);
      setEmail(user.email || '');
      const { data } = await supabase.from('perfiles').select('nombre, bio, telefono, ciudad, estado, sitio_web, avatar_url').eq('id', user.id).single();
      if (data) setProfile({ ...EMPTY_PROFILE, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) as ProfileData });
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!userId) return null;
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { setMessage({ type: 'error', text: 'Error uploading photo: ' + error.message }); return null; }
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true); setMessage(null);
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const url = await uploadAvatar(avatarFile);
      if (!url) { setSaving(false); return; }
      avatar_url = url;
      setAvatarFile(null); setAvatarPreview(null);
    }
    const { error } = await supabase.from('perfiles').upsert({ id: userId, ...profile, avatar_url, updated_at: new Date().toISOString() });
    if (error) { setMessage({ type: 'error', text: 'Error saving: ' + error.message }); }
    else { setProfile(p => ({ ...p, avatar_url })); setMessage({ type: 'success', text: '✅ Profile saved!' }); window.dispatchEvent(new Event('profile-updated')); }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setSavingPassword(true); setMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage({ type: 'error', text: 'Error: ' + error.message });
    else { setMessage({ type: 'success', text: '✅ Password updated!' }); setNewPassword(''); }
    setSavingPassword(false);
  };

  const set = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProfile(p => ({ ...p, [field]: e.target.value }));

  const displayAvatar = avatarPreview || profile.avatar_url;
  const initials = (profile.nombre || email).charAt(0).toUpperCase();

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-800 transition-all";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
      <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
            <p className="text-xs text-gray-400">Manage your public info and account settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {message && (
          <div className={`mb-5 p-3.5 rounded-2xl text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
          {(['profile', 'account'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'profile' ? '👤 Profile' : '🔒 Account'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="p-6 md:p-8 space-y-7">

              {/* Avatar + Name */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-2xl font-bold text-rose-400 relative border border-gray-100">
                    {displayAvatar ? <Image src={displayAvatar} alt="Avatar" fill className="object-cover" /> : initials}
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-full transition-colors">
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Display Name</label>
                  <input type="text" value={profile.nombre} onChange={set('nombre')} placeholder="Your name" className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1.5">Shown in the navbar and on your listings.</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Bio</label>
                <textarea value={profile.bio} onChange={set('bio')} rows={3} placeholder="Tell us about yourself..." className={`${inputClass} resize-none`} />
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Location</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">City</label>
                    <input type="text" value={profile.ciudad} onChange={set('ciudad')} placeholder="e.g. Miami" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">State</label>
                    <select value={profile.estado} onChange={set('estado')} className={inputClass}>
                      <option value="">Select state...</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Phone</label>
                    <input type="tel" value={profile.telefono} onChange={set('telefono')} placeholder="(555) 000-0000" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Website</label>
                    <input type="url" value={profile.sitio_web} onChange={set('sitio_web')} placeholder="https://yoursite.com" className={inputClass} />
                  </div>
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={saving}
                className="bg-gray-900 hover:bg-black text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-sm">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="p-6 md:p-8 space-y-7">

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span className="text-sm text-gray-700 font-medium">{email}</span>
                  <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">To change your email, contact support.</p>
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Change Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 characters)" className={inputClass} />
                <button onClick={handleUpdatePassword} disabled={savingPassword || !newPassword}
                  className="mt-3 bg-gray-900 hover:bg-black text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-sm">
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <hr className="border-gray-100" />

              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">Danger Zone</p>
                <div className="border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-50/30">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Delete Account</p>
                    <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and all listings.</p>
                  </div>
                  <button onClick={() => setMessage({ type: 'error', text: 'To delete your account, please contact support.' })}
                    className="shrink-0 text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
