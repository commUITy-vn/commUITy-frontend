import { api } from '@/lib/api-client';
import type { SupportRequestDetailResponse, CreateSupportRequestRequest } from './create-request';

export const updateSupportRequest = (
  id: string,
  data: Partial<CreateSupportRequestRequest>
): Promise<SupportRequestDetailResponse> => {
  return api.put<SupportRequestDetailResponse>(`/api/v1/support-requests/${id}`, data);
};
