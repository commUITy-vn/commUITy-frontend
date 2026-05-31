import { api } from '@/lib/api-client';
import { UpdateMediaRequest, MediaDetailResponse } from '../types';

export const updateMedia = (id: string, data: UpdateMediaRequest): Promise<MediaDetailResponse> => {
  return api.patch(`/api/v1/media/${id}`, data);
};
