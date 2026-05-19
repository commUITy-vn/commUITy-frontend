import { api } from '@/lib/api-client';

export const deletePost = (id: string) => {
  return api.delete(`/api/posts/${id}`);
};
