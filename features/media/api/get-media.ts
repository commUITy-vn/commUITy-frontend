import { api } from '@/lib/api-client';
import { MediaDetailResponse } from '../types';

export const getMedia = (id: string): Promise<MediaDetailResponse> => {
  return api.get(`/api/v1/media/${id}`);
};
