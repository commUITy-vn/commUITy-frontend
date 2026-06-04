import { api } from '@/lib/api-client';
import type { PayOsCheckoutResponse } from '@/features/finance/hooks/useCommunityFunds';

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

export const createPayOsContribution = (
  needId: string,
  data: AddContributionRequest,
): Promise<PayOsCheckoutResponse> => {
  return api.post(`/api/v1/support-needs/${needId}/contributions/payos`, data);
};
