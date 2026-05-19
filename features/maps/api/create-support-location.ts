import { api } from '@/lib/api-client';

export const createSupportLocation = (data: any) => {
  return api.post('/api/v1/support-locations', data);
};
