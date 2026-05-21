import { api } from '@/lib/api-client';
import { User } from '@/features/auth/types';

export const getMe = (): Promise<User> => {
  return api.get<User>('/api/v1/users/me');
};
