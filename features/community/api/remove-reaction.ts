import { api } from '@/lib/api-client';

export const removeReaction = (postId: string) => {
  return api.delete(`/api/v1/posts/${postId}/reactions`);
};
