import { api } from '@/lib/api-client';
import type { User } from '../types';

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; message: string; data: any }>('/api/v1/users/me');
  const profile = response.data;
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    imageUrl: profile.avatarUrl,
  };
};
