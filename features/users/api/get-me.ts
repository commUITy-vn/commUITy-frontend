import { api } from '@/lib/api-client';

export const getMe = () => {
  return api.get('/api/v1/users/me');
};
