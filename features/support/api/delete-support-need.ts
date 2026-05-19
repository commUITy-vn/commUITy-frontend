import { api } from '@/lib/api-client';

export const deleteSupportNeed = (needId: string): Promise<void> => {
  return api.delete(`/api/v1/support-needs/${needId}`);
};
