import { api } from '@/lib/api-client';

export const getUsers = () => {
  return api.get('/api/v1/users');
};
