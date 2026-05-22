import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CommunityFundSummary } from '../api/get-my-funds';

export const getCommunityFunds = (activeOnly?: boolean): Promise<CommunityFundSummary[]> => {
  return api.get('/api/v1/community-funds', {
    params: { activeOnly: activeOnly !== undefined ? activeOnly : false },
  });
};

export const useCommunityFunds = (activeOnly?: boolean) => {
  return useQuery<CommunityFundSummary[], Error>({
    queryKey: ['communityFunds', activeOnly],
    queryFn: () => getCommunityFunds(activeOnly),
  });
};
