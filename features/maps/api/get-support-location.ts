import { api } from '@/lib/api-client';
import { SupportLocation } from './get-support-locations';

export const getSupportLocation = (id: string): Promise<SupportLocation> => {
  return api.get<SupportLocation>(`/api/v1/support-locations/${id}`);
};
