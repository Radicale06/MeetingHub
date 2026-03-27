import { fetchApi } from './client';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  company: string | null;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  company?: string;
  timezone?: string;
  language?: string;
}

export const userApi = {
  getProfile: () => fetchApi<UserProfile>('/user/me'),

  updateProfile: (data: UpdateProfileData) =>
    fetchApi<UserProfile>('/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const { supabase } = await import('../lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();

    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/user/me/avatar`, {
      method: 'POST',
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  },

  removeAvatar: () =>
    fetchApi<UserProfile>('/user/me/avatar', { method: 'DELETE' }),
};
