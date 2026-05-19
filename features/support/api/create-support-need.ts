import { api } from '@/lib/api-client';
import type { SupportNeedResponse } from './get-support-needs';

export interface CreateSupportNeedRequest {
  itemName: string;
  unit: string;
  requiredQuantity: number;
}

export const createSupportNeed = (
  supportRequestId: string,
  data: CreateSupportNeedRequest
): Promise<SupportNeedResponse> => {
  return api.post<SupportNeedResponse>(`/api/v1/support-requests/${supportRequestId}/needs`, data);
};
