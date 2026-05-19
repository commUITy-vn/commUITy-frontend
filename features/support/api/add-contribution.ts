import { api } from '@/lib/api-client';

export interface AddContributionRequest {
  quantity: number;
  note?: string;
}

export const addContribution = (
  needId: string,
  data: AddContributionRequest
): Promise<void> => {
  return api.post(`/api/v1/support-needs/${needId}/contributions`, data);
};
