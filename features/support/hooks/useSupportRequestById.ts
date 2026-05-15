import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupportRequestById, SupportRequestDetailResponse } from '@/features/support/api/get-support-request-by-id';

export const useSupportRequestById = (id: string) => {
  return useQuery<SupportRequestDetailResponse, Error>({
    queryKey: ['supportRequest', id],
    queryFn: () => getSupportRequestById(id),
    enabled: !!id,
  });
};