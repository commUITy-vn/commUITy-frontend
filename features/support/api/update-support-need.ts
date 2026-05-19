import { api } from '@/lib/api-client';
import type { SupportNeedResponse, CreateSupportNeedRequest } from './create-support-need';

export const updateSupportNeed = (
  needId: string,
  data: CreateSupportNeedRequest
): Promise<SupportNeedResponse> => {
  return api.put<SupportNeedResponse>(`/api/v1/support-needs/${needId}`, data);
};
