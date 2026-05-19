import { api } from '@/lib/api-client';

export const createPost = (data: any) => {
  return api.post('/api/posts', data);
};
