import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/features/users/api/get-me';

export const useMe = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => getMe(),
  });
};
