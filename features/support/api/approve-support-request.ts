import { api } from '@/lib/api-client';

export const approveSupportRequest = (id: string): Promise<void> => {
  return api.patch(`/api/v1/support-requests/${id}/approve`);
};
