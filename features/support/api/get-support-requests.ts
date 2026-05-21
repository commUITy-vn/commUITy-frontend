import { api } from '@/lib/api-client';

export interface GetSupportRequestsParams {
  status?: string;
}

export interface SupportRequestSummaryResponse {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  requesterId: string;
  requesterName: string;
  status: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export const getSupportRequests = (
  params?: GetSupportRequestsParams
): Promise<SupportRequestSummaryResponse[]> => {
  return api.get<SupportRequestSummaryResponse[]>('/api/v1/support-requests', { params: params as any });
};