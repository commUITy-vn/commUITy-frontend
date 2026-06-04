import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupportRequest, CreateSupportRequestRequest } from '../api/create-request';

export const useCreateSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupportRequestRequest) => createSupportRequest(data),
    onSuccess: () => {
      // Invalidate the support requests list queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      queryClient.invalidateQueries({ queryKey: ['mySupportRequests'] });
    },
  });
};
