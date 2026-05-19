import { api } from '@/lib/api-client';

export const getMessages = (conversationId: string) => {
  return api.get(`/api/v1/conversations/${conversationId}/messages`);
};
