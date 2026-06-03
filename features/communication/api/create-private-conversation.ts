import { api } from '@/lib/api-client';

export const createPrivateConversation = (data: any) => {
  const receiverId = data?.receiverId || data?.recipientId || data?.userId;
  return api.post('/api/v1/conversations/private', { receiverId });
};
