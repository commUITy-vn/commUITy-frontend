import { api } from '@/lib/api-client';

export const createPostComment = (postId: string, data: any) => {
  return api.post(`/api/v1/posts/${postId}/comments`, data);
};
