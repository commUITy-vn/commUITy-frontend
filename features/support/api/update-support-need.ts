import { api } from '@/lib/api-client';
import type { CreateSupportNeedRequest } from './create-support-need';
import type { SupportNeedResponse } from './get-support-needs';

export const updateSupportNeed = (
  needId: string,
  data: CreateSupportNeedRequest
): Promise<SupportNeedResponse> => {
  return api.put<SupportNeedResponse>(`/api/v1/support-needs/${needId}`, data);
};
