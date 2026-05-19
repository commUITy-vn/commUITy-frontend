import { api } from '@/lib/api-client';

export const sendMessage = (conversationId: string, data: any) => {
  return api.post(`/api/v1/conversations/${conversationId}/messages`, data);
};
