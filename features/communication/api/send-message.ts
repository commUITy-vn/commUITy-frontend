import { api } from '@/lib/api-client';

export const sendMessage = (conversationId: string, data: any): Promise<any> => {
  return api.post<any>(`/api/v1/conversations/${conversationId}/messages`, data);
};
