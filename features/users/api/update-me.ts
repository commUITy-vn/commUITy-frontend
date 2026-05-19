import { api } from '@/lib/api-client';

export const updateMe = (data: any) => {
  return api.patch('/api/v1/users/me', data);
};
