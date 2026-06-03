import { api } from '@/lib/api-client';
import { User } from '@/features/auth/types';

export const getMe = async (): Promise<User> => {
  const profile = await api.get<any>('/api/v1/users/me');
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    imageUrl: profile.avatarUrl || profile.imageUrl,
  };
};
