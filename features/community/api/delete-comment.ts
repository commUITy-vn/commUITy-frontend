import { api } from '@/lib/api-client';

export const deleteComment = (commentId: string) => {
  return api.delete(`/api/v1/comments/${commentId}`);
};
