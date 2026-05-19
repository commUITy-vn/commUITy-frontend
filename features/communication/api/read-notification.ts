import { api } from '@/lib/api-client';

export const readNotification = (id: string) => {
  return api.patch(`/api/v1/notifications/${id}/read`);
};
