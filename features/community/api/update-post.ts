import { api } from '@/lib/api-client';

export const updatePost = (id: string, data: any) => {
  return api.put(`/api/posts/${id}`, data);
};
