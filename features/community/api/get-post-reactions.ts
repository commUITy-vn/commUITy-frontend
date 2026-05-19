import { api } from '@/lib/api-client';

export const getPostReactionsCount = (postId: string) => {
  return api.get(`/api/v1/posts/${postId}/reactions/count`);
};
