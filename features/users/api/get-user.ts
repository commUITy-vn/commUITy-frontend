import { api } from '@/lib/api-client';

export const getUser = (id: string) => {
  return api.get(`/api/v1/users/${id}`);
};
