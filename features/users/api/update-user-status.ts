import { api } from '@/lib/api-client';

export const updateUserStatus = (id: string, isActive: boolean) => {
  return api.patch(`/api/v1/users/${id}/status`, { isActive });
};
