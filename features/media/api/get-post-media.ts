import { api } from '@/lib/api-client';
import { PostMediaResponse } from '../types';

export const getPostMedia = (postId: string): Promise<PostMediaResponse[]> => {
  return api.get(`/api/v1/posts/${postId}/media`);
};
