import { api } from '@/lib/api-client';

export const getNotifications = () => {
  return api.get('/api/v1/notifications');
};
