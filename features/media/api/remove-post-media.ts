import { api } from '@/lib/api-client';

export const removePostMedia = (postId: string, mediaId: string): Promise<any> => {
  return api.delete(`/api/v1/posts/${postId}/media/${mediaId}`);
};
