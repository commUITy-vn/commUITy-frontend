import { useQuery } from '@tanstack/react-query';
import { getMyFunds, CommunityFundSummary } from '../api/get-my-funds';

export const useMyFunds = () => {
  const myFundsQuery = useQuery<CommunityFundSummary[], Error>({
    queryKey: ['myFunds'],
    queryFn: () => getMyFunds(),
  });

  return {
    funds: myFundsQuery.data || [],
    isLoading: myFundsQuery.isLoading,
    isError: myFundsQuery.isError,
    error: myFundsQuery.error,
    refetch: myFundsQuery.refetch,
  };
};
