import { api } from '@/lib/api-client';

export const reactToPost = (postId: string, data: any) => {
  return api.post(`/api/v1/posts/${postId}/reactions`, data);
};
