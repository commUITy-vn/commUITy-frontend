import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupportRequests, SupportRequestSummaryResponse } from '@/features/support/api/get-support-requests';

export const useSupportRequests = (status?: string) => {
  return useQuery<SupportRequestSummaryResponse[], Error>({
    queryKey: ['supportRequests', status],
    queryFn: () => getSupportRequests({ status }),
  });
};

export const useMySupportRequests = () => {
  // This would need an authenticated endpoint - for now we'll use the general one
  // In a real implementation, this would call a different endpoint like /api/support-requests/my-requests
  return useQuery<SupportRequestSummaryResponse[], Error>({
    queryKey: ['mySupportRequests'],
    queryFn: () => getSupportRequests(), // TODO: Replace with actual my-requests endpoint
  });
};