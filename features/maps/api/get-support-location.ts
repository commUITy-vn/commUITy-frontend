import { api } from '@/lib/api-client';

export const getSupportLocation = (id: string) => {
  return api.get(`/api/v1/support-locations/${id}`);
};
