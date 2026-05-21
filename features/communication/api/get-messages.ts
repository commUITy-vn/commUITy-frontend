import { api } from '@/lib/api-client';

export const getMessages = (conversationId: string): Promise<any[]> => {
  return api.get<any[]>(`/api/v1/conversations/${conversationId}/messages`);
};
