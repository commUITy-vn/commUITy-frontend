import { api } from '@/lib/api-client';

export const markMessageRead = (conversationId: string, messageId: string): Promise<any> => {
  return api.patch(`/api/v1/conversations/${conversationId}/messages/${messageId}/read`);
};
