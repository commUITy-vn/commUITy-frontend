import { api } from '@/lib/api-client';

export const updateUserStatus = (id: string, status: string) => {
  return api.patch(`/api/v1/users/${id}/status`, { status });
};
