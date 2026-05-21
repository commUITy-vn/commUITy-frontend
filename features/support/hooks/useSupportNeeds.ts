import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupportNeeds, SupportNeedResponse } from '@/features/support/api/get-support-needs';
import { addContribution, AddContributionRequest } from '@/features/support/api/add-contribution';

export const useSupportNeeds = (requestId: string) => {
  const queryClient = useQueryClient();

  const needsQuery = useQuery<SupportNeedResponse[], Error>({
    queryKey: ['supportNeeds', requestId],
    queryFn: () => getSupportNeeds(requestId),
    enabled: !!requestId,
  });

  const contributeMutation = useMutation<
    void,
    Error,
    { needId: string; data: AddContributionRequest }
  >({
    mutationFn: ({ needId, data }) => addContribution(needId, data),
    onSuccess: () => {
      // Invalidate supportNeeds and the supportRequest details
      queryClient.invalidateQueries({ queryKey: ['supportNeeds', requestId] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', requestId] });
    },
  });

  return {
    needs: needsQuery.data || [],
    isLoading: needsQuery.isLoading,
    isError: needsQuery.isError,
    error: needsQuery.error,
    contribute: contributeMutation.mutateAsync,
    isContributing: contributeMutation.isPending,
  };
};
