import { api } from '@/lib/api-client';

export const updateSupportLocation = (id: string, data: any) => {
  return api.put(`/api/v1/support-locations/${id}`, data);
};
