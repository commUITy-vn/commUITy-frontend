import { api } from '@/lib/api-client';

export const getPosts = (params?: any) => {
  return api.get('/api/posts', { params });
};
