import { api } from '@/lib/api-client';

export const getPostComments = (postId: string) => {
  return api.get(`/api/v1/posts/${postId}/comments`);
};
