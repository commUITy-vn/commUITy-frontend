import { api } from '@/lib/api-client';

export const readAllNotifications = (): Promise<any> => {
  return api.patch('/api/v1/notifications/read-all');
};
