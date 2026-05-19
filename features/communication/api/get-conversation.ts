import { api } from '@/lib/api-client';

export const getConversation = (id: string) => {
  return api.get(`/api/v1/conversations/${id}`);
};
