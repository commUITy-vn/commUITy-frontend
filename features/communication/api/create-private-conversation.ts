import { api } from '@/lib/api-client';

export const createPrivateConversation = (data: any) => {
  return api.post('/api/v1/conversations/private', data);
};
