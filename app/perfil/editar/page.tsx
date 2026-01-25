/**
 * Project: Senior Pet Living
 * Author: Gabriel Rosales
 * Date: January 27, 2026
 * Copyright © 2026 Gabriel Rosales. All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import BotonVolver from '@/components/BotonVolver';
import Image from 'next/image';

export default function EditarPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados para los datos del perfil
  const [full_name, setFullName] = useState<string>('');
  const [avatar_url, setAvatarUrl] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  
  // Estado para la imagen seleccionada
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);
        setEmail(user.email || '');

        let { data, error, status } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: 'Error loading user data!' });
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      if (!userId) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error uploading image: ' + error.message });
      return null;
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);
      setMessage(null);

      if (!userId) return;

      let newAvatarUrl = avatar_url;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        } else {
          setUpdating(false);
          return; // Si falla la subida, no seguimos
        }
      }

      const updates = {
        id: userId,
        full_name,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    } finally {
      setUpdating(false);
    }
  };

  const updateEmail = async () => {
    try {
      setUpdating(true);
      setMessage(null);
      const { error } = await supabase.auth.updateUser({ email: email });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Confirmation email sent to the new address!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error updating email: ' + error.message });
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async () => {
    try {
      setUpdating(true);
      setMessage(null);
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        setUpdating(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error updating password: ' + error.message });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
         <BotonVolver />
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 mt-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* --- Sección: Información Pública --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Public Information</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                  {(avatarPreview || avatar_url) ? (
                    <Image
                      src={avatarPreview || avatar_url}
                      alt="Avatar"
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 text-4xl">
                      👤
                    </div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Change Photo
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={updating} />
              </div>

              {/* Nombre */}
              <div className="flex-1 w-full">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Name"
                  disabled={updating}
                />
                <button
                  onClick={updateProfile}
                  disabled={updating}
                  className="mt-4 w-full md:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                >
                  {updating ? 'Saving...' : 'Save Profile Info'}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* --- Sección: Seguridad de la Cuenta --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Security</h2>
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex gap-3">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={updating}
                  />
                  <button
                    onClick={updateEmail}
                    disabled={updating}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    Update Email
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">You will need to confirm the new email address.</p>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="flex gap-3">
                  <input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    disabled={updating}
                  />
                  <button
                    onClick={updatePassword}
                    disabled={updating}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}