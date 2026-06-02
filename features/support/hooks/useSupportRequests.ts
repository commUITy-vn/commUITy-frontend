import { useQuery } from '@tanstack/react-query';
import { getSupportRequests, SupportRequestSummaryResponse } from '@/features/support/api/get-support-requests';
import { getMySupportRequests } from '@/features/support/api/get-my-support-requests';

export const useSupportRequests = (status?: string) => {
  return useQuery<SupportRequestSummaryResponse[], Error>({
    queryKey: ['supportRequests', status],
    queryFn: () => getSupportRequests({ status }),
  });
};

export const useMySupportRequests = () => {
  return useQuery<SupportRequestSummaryResponse[], Error>({
    queryKey: ['mySupportRequests'],
    queryFn: () => getMySupportRequests(),
  });
};
