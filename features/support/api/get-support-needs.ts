import { api } from '@/lib/api-client';

export interface SupportNeedResponse {
  id: string;
  supportRequestId: string;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  receivedQuantity: number;
}

export const getSupportNeeds = (supportRequestId: string): Promise<SupportNeedResponse[]> => {
  return api.get<SupportNeedResponse[]>(`/api/v1/support-requests/${supportRequestId}/needs`);
};
