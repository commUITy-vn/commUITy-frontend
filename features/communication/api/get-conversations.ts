import { api } from '@/lib/api-client';

export const getConversations = () => {
  return api.get('/api/v1/conversations/me');
};
