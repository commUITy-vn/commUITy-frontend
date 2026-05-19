import { api } from '@/lib/api-client';

export const applyVolunteer = (supportRequestId: string): Promise<void> => {
  return api.post(`/api/v1/volunteer-assignments/support-requests/${supportRequestId}/apply`);
};
