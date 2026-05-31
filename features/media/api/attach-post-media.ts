import { api } from '@/lib/api-client';
import { AttachMediaToPostRequest, PostMediaResponse } from '../types';

export const attachPostMedia = (postId: string, data: AttachMediaToPostRequest): Promise<PostMediaResponse> => {
  return api.post(`/api/v1/posts/${postId}/media`, data);
};
