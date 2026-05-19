import { api } from '@/lib/api-client';

export const rejectSupportRequest = (id: string, reason: string): Promise<void> => {
  return api.patch(`/api/v1/support-requests/${id}/reject`, { reason });
};
