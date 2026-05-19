import { api } from '@/lib/api-client';

export const getMyPosts = () => {
  return api.get('/api/posts/my-posts');
};
