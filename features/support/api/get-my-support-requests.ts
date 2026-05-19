import { api } from '@/lib/api-client';
import type { SupportRequestSummaryResponse } from './get-support-requests';

export const getMySupportRequests = (): Promise<SupportRequestSummaryResponse[]> => {
  return api.get<SupportRequestSummaryResponse[]>('/api/v1/support-requests/my-requests');
};
