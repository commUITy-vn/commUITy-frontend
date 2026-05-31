import { api } from '@/lib/api-client';
import { MediaSummaryResponse } from '../types';

export const getMyMedia = (): Promise<MediaSummaryResponse[]> => {
  return api.get('/api/v1/media/my-media');
};
