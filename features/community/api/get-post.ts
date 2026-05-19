import { api } from '@/lib/api-client';

export const getPost = (id: string) => {
  return api.get(`/api/posts/${id}`);
};
