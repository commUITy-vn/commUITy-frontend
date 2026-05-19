import { api } from '@/lib/api-client';

export const updateUserRole = (id: string, role: string) => {
  return api.patch(`/api/v1/users/${id}/role`, { role });
};
