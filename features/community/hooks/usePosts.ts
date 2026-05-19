import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/features/community/api/get-posts';

export const usePosts = (params?: any) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => getPosts(params),
  });
};