import { api } from '@/lib/api-client';
import { CreateMediaRequest, MediaDetailResponse } from '../types';

export const createMedia = (data: CreateMediaRequest): Promise<MediaDetailResponse> => {
  return api.post('/api/v1/media', data);
};
