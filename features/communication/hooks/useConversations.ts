import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/features/communication/api/get-conversations';

export const useConversations = (enabled = true) => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    enabled,
  });
};
